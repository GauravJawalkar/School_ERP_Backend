import type { Request, Response } from "express";
import { db } from "../db";
import { feeHeadsTable, feeStructuresTable, studentFeeAssignmentsTable, studentsTable } from "../models";
import { and, eq, sql } from "drizzle-orm";

// This controller creates a type of fee for a particular institute eg: Tution fee , transport fee, etc
const createFeeHead = async (req: Request, res: Response) => {
    try {
        const { instituteId, feeName, feeType, description, taxPercentage } = req.body;

        if (!instituteId || !feeName || !feeType) {
            return res.status(400).json({
                message: "Please provide required fields",
                status: 400
            })
        }

        const [existingFeeHead] = await db
            .select()
            .from(feeHeadsTable)
            .where(
                and(
                    eq(feeHeadsTable.feeName, feeName),
                    eq(feeHeadsTable.instituteId, instituteId)
                )
            ).limit(1);

        if (existingFeeHead) {
            return res.status(400).json({
                message: "This fee head already exist for this institute",
                status: 400
            })
        }

        const [newFeeHead] = await db
            .insert(feeHeadsTable)
            .values({
                instituteId,
                feeName,
                feeType,
                description,
                taxPercentage
            }).returning();

        if (!newFeeHead) {
            return res.status(400).json({
                message: "Failed to create new Fee Head",
                status: 400
            })
        }

        return res.status(201).json({
            message: "New Feed Head Added Successfully",
            status: 201
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error creating Fee Head",
            status: 500
        })
    }
}

// This controller creates feeStructure as per individual class for the institute
const createFeeStructure = async (req: Request, res: Response) => {
    try {
        const { academicYearId, instituteId, classId, feeHeadId, amount, frequency, isCompulsory } = req.body;

        if (!academicYearId || !classId || !instituteId || !feeHeadId || !amount || !frequency) {
            return res.status(400).json({
                message: "Please provide all the required fields",
                status: 400
            })
        }

        const [existingFeeStucture] = await db
            .select()
            .from(feeStructuresTable)
            .where(
                and(
                    eq(feeStructuresTable.classId, classId),
                    eq(feeStructuresTable.feeHeadId, feeHeadId),
                    eq(feeStructuresTable.instituteId, instituteId),
                )
            ).limit(1);

        if (existingFeeStucture) {
            return res.status(400).json({
                message: "This fee structure already exists for this class",
                status: 400
            })
        }

        const [newFeeStructure] = await db
            .insert(feeStructuresTable)
            .values({
                academicYearId,
                instituteId,
                classId,
                feeHeadId,
                amount,
                frequency,
                isCompulsory
            }).returning();

        if (!newFeeStructure) {
            return res.status(400).json({
                message: "Failed to create new fee structure for this class",
                status: 400
            })
        }

        return res.status(201).json({
            message: "Create new feeStructure",
            status: 201
        })

    } catch (error) {
        console.error('Error : ', error);
        return res.status(500).json({
            message: "Internal Server Error creating fee structure",
            status: 500
        })
    }
}

// After enrollment of student, auto-assign compulsory fees
const assignFees = async (req: Request, res: Response) => {
    try {
        const { studentId, classId, instituteId, discountPercentage, discountReason, isWaived, waivedReason, academicYearId } = req.body;

        // req.user may be a string (user id) or a JwtPayload object; normalize to a string id
        const assignedBy = typeof req.user === "string" ? req.user : (req.user as { id?: string }).id;

        if (!studentId || !instituteId || !assignedBy || !classId || !academicYearId) {
            return res.status(400).json({
                message: "Please provide all the required fields",
                status: 400
            })
        }

        const [student] = await db
            .select()
            .from(studentsTable)
            .where(
                and(
                    eq(studentsTable.id, studentId),
                    eq(studentsTable.instituteId, instituteId)
                )
            )
            .limit(1);

        if (!student) {
            return res.status(404).json({
                message: "Student not found",
                status: 404
            });
        }

        // Fetch all COMPULSORY fee structures for this class and academic year
        const feeStructures = await db
            .select()
            .from(feeStructuresTable)
            .where(
                and(
                    eq(feeStructuresTable.classId, classId),
                    eq(feeStructuresTable.academicYearId, academicYearId),
                    eq(feeStructuresTable.instituteId, instituteId),
                    eq(feeStructuresTable.isCompulsory, true)
                )
            );

        if (feeStructures.length === 0) {
            return res.status(404).json({
                message: "No compulsory fee structures found for this class",
                status: 404
            });
        }

        const alreadyAssigned = await db
            .select()
            .from(studentFeeAssignmentsTable)
            .where(
                and(
                    eq(studentFeeAssignmentsTable.studentId, studentId),
                    eq(studentFeeAssignmentsTable.instituteId, instituteId),
                )
            ).limit(1);

        if (alreadyAssigned.length > 0) {
            return res.status(400).json({
                message: "Fees are already assigned to this student",
                status: 400,
                existingAssignments: alreadyAssigned.length
            })
        }

        // Prepare assignments for all compulsory fees
        const assignments = feeStructures.map(feeStructure => {
            const baseAmount = parseFloat(feeStructure.amount);
            const discount = parseFloat(discountPercentage);

            // Calculate effective amount
            let effectiveAmount: number;

            if (isWaived) {
                effectiveAmount = 0; // Fully waived
            } else {
                // Apply discount: amount - (amount * discount / 100)
                effectiveAmount = baseAmount - (baseAmount * discount / 100);
            }

            return {
                studentId,
                instituteId,
                feeStructureId: feeStructure.id,
                customAmount: null, // Can be set for individual fee heads if needed
                discountPercentage: discountPercentage.toString(),
                discountReason,
                isWaived,
                waivedReason,
                effectiveAmount: effectiveAmount.toFixed(2),
                assignedBy
            };
        });

        // Insert all fee assignments in one transaction
        const assignedFees = await db
            .insert(studentFeeAssignmentsTable)
            .values(assignments)
            .returning();

        if (!assignedFees || assignedFees.length === 0) {
            return res.status(400).json({
                message: "Failed to assign fees to the student",
                status: 400
            });
        }

        return res.status(201).json({
            message: "Fess assigned Successfully",
            status: 201
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error assigning fees to student",
            status: 500
        })
    }
}

export { createFeeHead, createFeeStructure, assignFees }