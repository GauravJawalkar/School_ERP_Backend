import type { Request, Response } from "express";
import { db } from "../db";
import { feeHeadsTable, feeStructuresTable } from "../models";
import { and, eq } from "drizzle-orm";

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
        const { studentId, instituteId, feeStructureId, customAmount, discountPercentage, discountReason, isWaived, waivedReason, effectiveAmount, assignedBy, } = req.body;

        if (!studentId || !instituteId || !feeStructureId || !effectiveAmount || !assignedBy) {
            return res.status(400).json({
                message: "Please provide all the required fields",
                status: 400
            })
        }



    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error assigning fees to student",
            status: 500
        })
    }
}

export { createFeeHead, createFeeStructure, assignFees }