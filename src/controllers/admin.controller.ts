import type { Request, Response } from "express";
import { db } from "../db";
import { academicYearsTable } from "../models";
import { and, eq } from "drizzle-orm";

const createAcademicYear = async (req: Request, res: Response) => {
    try {
        const { instituteId, name, startDate, endDate, isActive } = req.body;

        // Validation
        if (!name || !startDate || !endDate || !instituteId) {
            return res.status(400).json({
                message: "Name, startDate, endDate, and instituteId are required",
                status: 400
            });
        }

        // Validate date order
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end <= start) {
            return res
                .status(400)
                .json({ message: "End date must be after start date", status: 400 });
        }

        // Check for duplicate academic year name for this institute
        const existingYear = await db
            .select()
            .from(academicYearsTable)
            .where(
                and(
                    eq(academicYearsTable.instituteId, instituteId),
                    eq(academicYearsTable.name, name)
                )
            )
            .limit(1);

        if (existingYear.length > 0) {
            return res.status(409).json({
                message:
                    "Academic year with this name already exists for this institute",
                status: 409,
            });
        }

        // If isActive is true, deactivate all other academic years for this institute
        if (isActive) {
            await db
                .update(academicYearsTable)
                .set({ isActive: false })
                .where(eq(academicYearsTable.instituteId, instituteId));
        }

        const [academicYear] = await db
            .insert(academicYearsTable)
            .values({
                name,
                instituteId,
                startDate,
                endDate,
                isActive,
            })
            .returning();

        if (!academicYear) {
            return res
                .status(400)
                .json({ message: "Failed to create academic Year", status: 400 });
        }

        return res
            .status(201)
            .json({ message: "Academic Year created successfully", status: 201 });
    } catch (error) {
        console.error("Error creating academic Year: ", error);
        return res
            .status(500)
            .json({
                message: "Internal Server Error creating academic year",
                status: 500,
            });
    }
};

const createStaff = async (req: Request, res: Response) => {
    try {

    } catch (error) {

    }
}

export { createAcademicYear };
