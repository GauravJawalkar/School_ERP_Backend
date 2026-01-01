import type { Request, Response } from "express";
import type { TokenUser } from "../interface";
import { db } from "../db";
import { instituteProfileTable, studentsTable } from "../models";
import { and, eq } from "drizzle-orm";

const getStuentsForSchool = async (req: Request, res: Response) => {
    try {
        const loggedInUser = req.user as TokenUser;
        const instituteId = Number(loggedInUser?.instituteId);

        if (!instituteId || isNaN(instituteId)) {
            return res.status(400).json({
                message: "Invalid instituteId",
                status: 400
            })
        }

        // Check if institute exists -
        const [instituteExists] = await db
            .select()
            .from(instituteProfileTable)
            .where(
                eq(instituteProfileTable.id, instituteId)
            ).limit(1);

        if (!instituteExists) {
            return res.status(404).json({
                message: "Institute not found",
                status: 404
            })
        }

        // Find students in the database for the specific school
        const students = await db
            .select()
            .from(studentsTable)
            .where(
                and(
                    eq(studentsTable.instituteId, instituteId),
                    eq(studentsTable.status, 'ACTIVE'),
                )
            );

        return res.status(200).json({
            message: "Students fetched Successfully",
            data: students,
            status: 200
        })

    } catch (error) {
        console.error("Error in getStuentsForSchool: ", error);
        return res.status(500).json({
            message: "Internal Server Error getting students for school",
            status: 500
        })
    }
}

const getStudentProfile = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.studentId);
        const loggedInUser = req.user as TokenUser;
        const instituteId = Number(loggedInUser?.instituteId);

        if (!studentId || isNaN(studentId) || !instituteId || isNaN(instituteId)) {
            return res.status(400).json({
                message: "Invalid studentId or instituteId",
                status: 400
            })
        }

        // Find student in the database for the specific school
        const student = await db
            .select()
            .from(studentsTable)
            .where(
                and(
                    eq(studentsTable.id, studentId),
                    eq(studentsTable.instituteId, instituteId),
                    eq(studentsTable.status, 'ACTIVE'),
                )
            ).limit(1);

        // check if the student exists
        if (student?.length === 0 || !student) {
            return res.status(404).json({
                message: "Student with this student ID not found in this school",
                status: 404
            })
        }

        return res.status(200).json({
            message: "Student Profile fetched Successfully",
            data: student,
            status: 200
        })


    } catch (error) {
        console.log("Error in getStudentProfile: ", error);
        res.status(500).json({
            message: "Internal Server Error getting student profile",
            status: 500
        })
    }
}

export { getStudentProfile, getStuentsForSchool }