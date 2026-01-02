import type { Request, Response } from "express";
import type { TokenUser } from "../interface";
import { db } from "../db";
import { admissionsTable, instituteProfileTable, parentsTable, sectionsTable, studentsTable } from "../models";
import { and, asc, eq } from "drizzle-orm";

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

const getStudentsByClassOrSection = async (req: Request, res: Response) => {
    try {
        const { classId, sectionId } = req.params;
        const loggedInUser = req.user as TokenUser;
        const targetInstituteId = Number(loggedInUser.instituteId);

        const filters = [
            eq(studentsTable.instituteId, targetInstituteId),
            eq(studentsTable.status, 'ACTIVE')
        ];

        if (classId) {
            filters.push(eq(studentsTable.currentClassId, Number(classId)));
        }

        if (sectionId) {
            filters.push(eq(studentsTable.currentSectionId, Number(sectionId)));
        }

        const students = await db
            .select({
                id: studentsTable.id,
                admissionNo: studentsTable.admissionNo,
                firstName: studentsTable.firstName,
                lastName: studentsTable.lastName,
                rollNumber: studentsTable.rollNo,
                gender: studentsTable.gender,
                primaryPhone: parentsTable.primaryPhone,
                fatherName: parentsTable.fatherName
            })
            .from(studentsTable)
            .leftJoin(parentsTable, eq(parentsTable.studentId, studentsTable.id))
            .where(and(...filters))
            .orderBy(asc(studentsTable.rollNo));

        return res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });

    } catch (error: any) {
        console.error("❌ Error fetching students:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch students",
            error: error.message
        });
    }
};

// TODO: Implement proper fallbacks if the student is not transferred or if any query fails
const transferStudent = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.studentId);
        const { newSectionId, reason } = req.body;

        if (!newSectionId) {
            return res.status(400).json({
                success: false,
                message: "New section ID is required"
            });
        }

        const [student] = await db
            .select()
            .from(studentsTable)
            .where(eq(studentsTable.id, studentId))
            .limit(1);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Get new section details
        const [newSection] = await db
            .select()
            .from(sectionsTable)
            .where(eq(sectionsTable.id, newSectionId))
            .limit(1);

        if (!newSection) {
            return res.status(404).json({
                success: false,
                message: "New section not found"
            });
        }

        // Update student
        await db
            .update(studentsTable)
            .set({
                currentSectionId: newSectionId,
                currentClassId: Number(newSection.classId),
            })
            .where(eq(studentsTable.id, studentId));

        const studentAddmissionNo = Number(student?.admissionNo);

        // Update current enrollment
        await db
            .update(admissionsTable)
            .set({
                classId: Number(newSection.classId)
            })
            .where(
                and(
                    eq(admissionsTable.id, studentAddmissionNo),
                    eq(admissionsTable.applicationStatus, 'APPROVED')
                )
            );

        return res.status(200).json({
            success: true,
            message: "Student transferred successfully",
            data: {
                studentId,
                newSectionId,
                reason: reason || 'Section transfer'
            }
        });

    } catch (error: any) {
        console.error("❌ Error transferring student:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to transfer student",
            error: error.message
        });
    }
};

const updateStudent = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.studentId);
        const loggedInUser = req.user as TokenUser;
        const targetInstituteId = Number(loggedInUser.instituteId);

        const {
            firstName,
            lastName,
            DOB,
            gender,
            category,
            rollNumber
        } = req.body;

        // Check if student exists
        const [existingStudent] = await db
            .select()
            .from(studentsTable)
            .where(
                and(
                    eq(studentsTable.id, studentId),
                    eq(studentsTable.instituteId, targetInstituteId)
                )
            ).limit(1);

        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Update student
        const [updatedStudent] = await db
            .update(studentsTable)
            .set({
                firstName: firstName || existingStudent.firstName,
                lastName: lastName || existingStudent.lastName,
                DOB: DOB || existingStudent.DOB,
                gender: gender || existingStudent.gender,
                category: category || existingStudent.category,
                rollNo: rollNumber || existingStudent.rollNo,
            })
            .where(
                and(
                    eq(studentsTable.id, studentId),
                    eq(studentsTable.instituteId, targetInstituteId),
                )
            ).returning();

        return res.status(200).json({
            success: true,
            message: "Student updated successfully",
            data: updatedStudent
        });

    } catch (error: any) {
        console.error("Error updating student:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update student",
            error: error.message
        });
    }
};

const promoteStudent = async (req: Request, res: Response) => {
    try {

    } catch (error) {
        console.error("Error in promoteStudent: ", error);
        return res.status(500).json({
            message: "Internal Server Error promoting student",
            status: 500
        })
    }
}

export { getStudentProfile, getStuentsForSchool, getStudentsByClassOrSection, transferStudent, updateStudent, promoteStudent }