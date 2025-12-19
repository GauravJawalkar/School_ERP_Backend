import type { Request, Response } from "express";
import { db } from "../db";
import { feeHeadsTable, feeInstallmentsTable, feeStructuresTable, invoiceLineItemsTable, invoicesTable, studentFeeAssignmentsTable, studentsTable } from "../models";
import { and, eq, sql } from "drizzle-orm";
import { generateInvoiceNumber } from "../helpers/generateInvoiceNumber";
import type { TokenUser } from "../interface";

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

// After enrollment of student, auto-assign compulsory fees -> DONE (Keeping this one incase of manual assignment)
const assignFees = async (req: Request, res: Response) => {
    try {
        const { classId, instituteId, discountPercentage, discountReason, isWaived, waivedReason, academicYearId } = req.body;

        const studentId = Number(req.params.id);

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
                discountPercentage: null,
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
        console.error('Error is : ', error);
        return res.status(500).json({
            message: "Internal Server Error assigning fees to student",
            status: 500,
            error: error
        })
    }
}

// This controller creates feeInstallments like quartely, yearly,halfYear for specific institute
const createFeeInstallment = async (req: Request, res: Response,) => {
    try {
        const { academicYearId, name, installmentNumber, dueDate, lateFeeStartDate, finePerDay, instituteId } = req.body;

        if (!academicYearId || !name || !installmentNumber || !dueDate || !finePerDay || !instituteId) {
            return res.status(400).json({
                message: "Please provide the required fields",
                status: 400
            })
        }

        const [existingInstallment] = await db
            .select()
            .from(feeInstallmentsTable)
            .where(
                and(
                    eq(feeInstallmentsTable.academicYearId, academicYearId),
                    eq(feeInstallmentsTable.installmentName, name)
                )
            ).limit(1);

        if (existingInstallment) {
            return res.status(400).json({
                message: "The installment already exist for this academic year",
                status: 400
            })
        }

        const [newFeeInstallment] = await db
            .insert(feeInstallmentsTable)
            .values({
                academicYearId: academicYearId,
                instituteId,
                installmentName: name,
                installmentNumber,
                dueDate,
                finePerDay,
                lateFeeStartDate
            }).returning();

        if (!newFeeInstallment) {
            return res.status(400).json({
                message: "Failed to create the fee installment",
                status: 400
            })
        }

        return res.status(201).json({
            message: "Fee Installment created Successfully",
            status: 201
        })

    } catch (error) {
        console.log("Error creating installment : ", error)
        return res.status(500).json({
            message: "Internal server error creating installment",
            status: 500
        })
    }
}

// Generate invoices for students as per their installments (quartely, yearly,halfYear)
const generateInvoice = async (req: Request, res: Response) => {
    try {
        const { studentId, installmentId } = req.body;

        if (!studentId || !installmentId) {
            return res.status(400).json(
                {
                    message: "Please provide required fields",
                    status: 400
                }
            )
        }

        // Get authenticated user (who's generating the invoice)
        const generatedBy = (req.user && typeof req.user !== "string" && "id" in req.user)
            ? (req.user as TokenUser).id
            : undefined;

        const [existingStudent] = await db
            .select({
                id: studentsTable.id,
                firstName: studentsTable.firstName,
                lastName: studentsTable.lastName,
                admissionNo: studentsTable.admissionNo,
                instituteId: studentsTable.instituteId,
                currentClassId: studentsTable.currentClassId
            })
            .from(studentsTable)
            .where(
                and(
                    eq(studentsTable.id, studentId),
                    eq(studentsTable.status, "ACTIVE")
                )
            ).limit(1);

        if (!existingStudent) {
            return res.status(404).json({
                message: "Student with this studentId not found",
                status: 404
            })
        }

        // 2. Get installment details
        const [installment] = await db
            .select()
            .from(feeInstallmentsTable)
            .where(eq(feeInstallmentsTable.id, installmentId))
            .limit(1);

        if (!installment) {
            return res.status(404).json({
                success: false,
                message: "Installment not found",
                status: 404
            });
        }

        // 3. Check if invoice already exists for this student and installment
        const [existingInvoice] = await db
            .select()
            .from(invoicesTable)
            .where(
                and(
                    eq(invoicesTable.studentId, studentId),
                    eq(invoicesTable.installmentId, installmentId)
                )
            )
            .limit(1);

        if (existingInvoice) {
            return res.status(400).json({
                success: false,
                message: "Invoice already exists for this student and installment",
                status: 400,
                data: {
                    invoiceId: existingInvoice.id,
                    invoiceNo: existingInvoice.invoiceNo
                }
            });
        }

        // 4. Get student's fee assignments with fee structure and fee head details
        const feeAssignments = await db
            .select({
                assignmentId: studentFeeAssignmentsTable.id,
                effectiveAmount: studentFeeAssignmentsTable.effectiveAmount,
                isWaived: studentFeeAssignmentsTable.isWaived,

                // Fee Structure details
                feeStructureId: feeStructuresTable.id,
                frequency: feeStructuresTable.frequency,
                amount: feeStructuresTable.amount,

                // Fee Head details
                feeHeadId: feeHeadsTable.id,
                feeHeadName: feeHeadsTable.feeName,
                taxPercentage: feeHeadsTable.taxPercentage,
                feeType: feeHeadsTable.feeType
            })
            .from(studentFeeAssignmentsTable)
            .innerJoin(
                feeStructuresTable,
                eq(studentFeeAssignmentsTable.feeStructureId, feeStructuresTable.id)
            )
            .innerJoin(
                feeHeadsTable,
                eq(feeStructuresTable.feeHeadId, feeHeadsTable.id)
            )
            .where(
                and(
                    eq(studentFeeAssignmentsTable.studentId, studentId),
                    eq(studentFeeAssignmentsTable.instituteId, existingStudent.instituteId),
                    eq(feeStructuresTable.academicYearId, installment.academicYearId)
                )
            );


        if (feeAssignments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No fee assignments found for this student",
                status: 404
            });
        }

        // 5. Get total number of installments for the academic year
        const totalInstallments = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(feeInstallmentsTable)
            .where(eq(feeInstallmentsTable.academicYearId, installment.academicYearId));

        const installmentCount = totalInstallments[0]?.count || 4;

        // 6. Calculate line items based on frequency
        const lineItems = feeAssignments.map(assignment => {
            let amountForInstallment: number;
            const effectiveAmount = parseFloat(assignment.effectiveAmount);

            // If waived, amount is 0
            if (assignment.isWaived) {
                amountForInstallment = 0;
            } else {
                // Calculate based on frequency
                switch (assignment.frequency) {
                    case 'ANNUALLY':
                        // Divide annual amount by number of installments
                        amountForInstallment = effectiveAmount / 4;
                        break;

                    case 'QUARTERLY':
                        // Full amount for quarterly fees
                        amountForInstallment = effectiveAmount;
                        break;

                    case 'HALF_YEARLY':
                        // Half-yearly fees divided by 2
                        amountForInstallment = installment.installmentNumber <= 2
                            ? effectiveAmount / 2
                            : 0;
                        break;

                    case 'ONE_TIME':
                        // One-time fees only in first installment
                        amountForInstallment = installment.installmentNumber === 1
                            ? effectiveAmount
                            : 0;
                        break;

                    default:
                        amountForInstallment = effectiveAmount / installmentCount;
                }
            }

            // Calculate tax
            const taxPercentage = parseFloat(assignment.taxPercentage || "0");
            const taxAmount = (amountForInstallment * taxPercentage) / 100;
            const totalAmount = amountForInstallment + taxAmount;

            return {
                feeHeadId: assignment.feeHeadId,
                feeHeadName: assignment.feeHeadName,
                description: `${assignment.feeHeadName} - ${installment.installmentName}`,
                amount: amountForInstallment.toFixed(2),
                taxPercentage: taxPercentage.toFixed(2),
                taxAmount: taxAmount.toFixed(2),
                totalAmount: totalAmount.toFixed(2),
                frequency: assignment.frequency
            };
        }).filter(item => parseFloat(item.totalAmount) > 0); // Remove zero-amount items

        if (lineItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fees applicable for this installment",
                status: 400
            });
        }

        // 7. Calculate invoice totals
        const totalAmount = lineItems.reduce(
            (sum, item) => sum + parseFloat(item.totalAmount),
            0
        ).toFixed(2);

        // 8. Generate unique invoice number
        const invoiceNo = await generateInvoiceNumber(existingStudent.instituteId);

        // 9. Create invoice
        const [newInvoice] = await db
            .insert(invoicesTable)
            .values({
                invoiceNo,
                instituteId: existingStudent.instituteId,
                studentId,
                installmentId,
                academicYearId: installment.academicYearId,
                totalAmount,
                paidAmount: "0.00",
                balanceAmount: totalAmount,
                lateFine: "0.00",
                status: 'UNPAID',
                generatedBy: generatedBy,
                notes: `Generated for ${installment.installmentName}`
            })
            .returning();

        if (!newInvoice) {
            return res.status(500).json({
                success: false,
                message: "Failed to create invoice",
                status: 500
            });
        }

        // 10. Create line items
        const lineItemsData = lineItems.map(item => ({
            invoiceId: newInvoice.id,
            feeHeadId: item.feeHeadId,
            description: item.description,
            amount: item.amount,
            taxPercentage: item.taxPercentage,
            taxAmount: item.taxAmount,
            totalAmount: item.totalAmount
        }));

        const createdLineItems = await db
            .insert(invoiceLineItemsTable)
            .values(lineItemsData)
            .returning();

        // 11. Return complete invoice details
        return res.status(201).json({
            success: true,
            message: "Invoice generated successfully",
            status: 201,
            data: {
                invoice: {
                    id: newInvoice.id,
                    invoiceNo: newInvoice.invoiceNo,
                    studentName: `${existingStudent.firstName} ${existingStudent.lastName}`,
                    admissionNo: existingStudent.admissionNo,
                    installment: installment.installmentName,
                    totalAmount: newInvoice.totalAmount,
                    balanceAmount: newInvoice.balanceAmount,
                    status: newInvoice.status,
                    generatedAt: newInvoice.generatedAt
                },
                lineItems: lineItems.map((item, index) => ({
                    ...item,
                    id: createdLineItems[index]?.id
                })),
                summary: {
                    subtotal: lineItems.reduce(
                        (sum, item) => sum + parseFloat(item.amount),
                        0
                    ).toFixed(2),
                    totalTax: lineItems.reduce(
                        (sum, item) => sum + parseFloat(item.taxAmount),
                        0
                    ).toFixed(2),
                    grandTotal: totalAmount
                }
            }
        });

    } catch (error) {
        console.error('Error generating Invoice : ', error);
        return res.status(500).json({
            message: "Internal Server Error generating Invoice",
            status: 500
        })
    }
}

export { createFeeHead, createFeeStructure, assignFees, generateInvoice, createFeeInstallment }