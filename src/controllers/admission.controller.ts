import type { Request, Response } from "express";
import { db } from "../db";
import { admissionsTable, feeStructuresTable, parentsTable, rolesTable, studentEnrollmentTable, studentFeeAssignmentsTable, studentsTable, userRoleTable, usersTable, classesTable, academicYearsTable, instituteProfileTable } from "../models";
import { and, eq } from "drizzle-orm";
import bcrypt from 'bcrypt'
import type { TokenUser } from "../interface";
import { sendFirstTimeCredentialsEmail } from "../helpers/firstTimeLoginEmail";
import { getLoggedInUserDetails } from "../services/auth.service";

const createAddmission = async (req: Request, res: Response) => {
    try {
        const { instituteId: loggedInInstId, roles } = await getLoggedInUserDetails(req);
        const isSuperAdmin = roles.includes("SUPER_ADMIN");
        const { academicYearId, admissionDate, name, board, parentPhoneNo, applicationStatus, classId, instituteId: reqInstId } = req.body;

        const targetInstituteId = (isSuperAdmin && reqInstId) ? Number(reqInstId) : loggedInInstId;

        let effectiveBoard = (board && typeof board === "string" && board.trim() !== "") ? board.trim().toUpperCase() : null;

        if (!effectiveBoard && classId) {
            const [targetClass] = await db
                .select({ id: classesTable.id, board: classesTable.board })
                .from(classesTable)
                .where(eq(classesTable.id, Number(classId)))
                .limit(1);

            if (targetClass?.board) {
                effectiveBoard = targetClass.board;
            }
        }

        if (!effectiveBoard) {
            effectiveBoard = "CBSE";
        }

        if (!academicYearId || !admissionDate || !targetInstituteId || !name || !parentPhoneNo || !classId) {
            return res.status(400).json({ message: 'Please provide required fields', status: 400 });
        }

        const [existinAddmission] = await db
            .select()
            .from(admissionsTable)
            .where(
                and(
                    eq(admissionsTable.name, name),
                    eq(admissionsTable.academicYearId, academicYearId),
                    eq(admissionsTable.instituteId, targetInstituteId),
                    eq(admissionsTable.classId, classId)
                )
            ).limit(1);

        if (existinAddmission) {
            return res.status(400).json({ message: 'Addmission with the same name already exists for this class and academic year.', status: 400 });
        }

        const [newAddmission] = await db
            .insert(admissionsTable)
            .values({
                academicYearId,
                admissionDate,
                instituteId: targetInstituteId,
                name,
                board: effectiveBoard,
                parentPhoneNo,
                applicationStatus,
                classId
            }).returning();

        if (!newAddmission) {
            return res.status(400).json({ message: 'Failed to create the addmission', status: 400 });
        }

        return res.status(201).json({ message: 'Addmission Created Successfully', data: newAddmission, status: 201 });

    } catch (error) {
        console.log("Error creating addmission: ", error);
        return res.status(500).json({
            message: "Internal Server Error creating addmission",
            status: 500,
        });
    }
}

const approveAddmission = async (req: Request, res: Response) => {
    try {
        const addmissionId = Number(req.params.id);
        const { instituteId: loggedInInstId, roles } = await getLoggedInUserDetails(req);
        const isSuperAdmin = roles.includes("SUPER_ADMIN");

        const { firstName, lastName, email, phone, gender, DOB, fatherName, motherName, address } = req.body;
        const roleName = "STUDENT";

        if (!addmissionId) {
            return res.status(400).json({ message: 'Please provide valid admission ID', status: 400 });
        }

        const [admission] = await db
            .select()
            .from(admissionsTable)
            .where(eq(admissionsTable.id, addmissionId))
            .limit(1);

        if (!admission) {
            return res.status(404).json({ message: "Admission record not found", status: 404 });
        }

        if (!isSuperAdmin && admission.instituteId !== loggedInInstId) {
            return res.status(403).json({ message: "Access denied. You do not have permission to manage this school's admissions.", status: 403 });
        }

        const targetInstituteId = admission.instituteId;

        if (!firstName || !lastName || !targetInstituteId || !email || !phone || !gender || !DOB || !fatherName || !motherName || !address) {
            return res.status(400).json({ message: 'Please provide required fields', status: 400 });
        }

        if (phone.trim().length > 10) {
            return res.status(400).json({ message: "You entered more than 10 digits for the phone number", status: 400 })
        }

        const [exstingUser] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);

        if (exstingUser) {
            return res.status(400).json({ message: 'This email is already in use', status: 400 });
        }

        const [alreadyApprovedAddmission] = await db
            .select()
            .from(admissionsTable)
            .where(
                and(
                    eq(admissionsTable.id, addmissionId),
                    eq(admissionsTable.applicationStatus, 'APPROVED')
                )
            ).limit(1);

        if (alreadyApprovedAddmission) {
            return res.status(400).json({ message: "Admission is already approved", status: 400 });
        }

        // Check if role exists in database roles table
        const [targetRole] = await db
            .select({ id: rolesTable.id, name: rolesTable.name })
            .from(rolesTable)
            .where(eq(rolesTable.name, roleName))
            .limit(1);

        if (!targetRole) {
            return res
                .status(404)
                .json({
                    status: 404,
                    message: `Role '${roleName}' not found in the database.`,
                });
        }

        // After successful approval of admission create user account for student and send credentials to parent phone number or email.
        const autoGeneratedPassword = `${firstName}@${Math.floor(1000 + Math.random() * 9000)}`;

        const password_hash = bcrypt.hashSync(autoGeneratedPassword, Number(process.env.SALT_ROUNDS)).toString();
        const assignedBy = (req.user && typeof req.user !== "string" && "id" in req.user) ? (req.user as TokenUser).id : undefined;

        // Perform all database modifications in a transaction block
        const transactionResult = await db.transaction(async (tx) => {
            const [newUser] = await tx
                .insert(usersTable)
                .values({
                    firstName,
                    lastName,
                    instituteId: targetInstituteId,
                    email,
                    phone,
                    gender,
                    password_hash,
                    isActive: false
                }).returning();

            if (!newUser) {
                throw new Error("Failed to create user");
            }

            const [userRoleAssignment] = await tx
                .insert(userRoleTable)
                .values({
                    userId: newUser.id,
                    roleId: targetRole.id,
                    assignedBy: assignedBy,
                }).returning();

            if (!userRoleAssignment) {
                throw new Error("Failed to assign role to user");
            }

            await tx
                .update(admissionsTable)
                .set({ userId: newUser.id })
                .where(eq(admissionsTable.id, addmissionId));

            const [updatedAdmission] = await tx
                .update(admissionsTable)
                .set({
                    applicationStatus: 'APPROVED'
                })
                .where(eq(admissionsTable.id, addmissionId))
                .returning();

            if (!updatedAdmission) {
                throw new Error("Failed to approve the admission record");
            }

            const [newStudentRecord] = await tx
                .insert(studentsTable)
                .values({
                    instituteId: targetInstituteId,
                    admissionNo: addmissionId,
                    userId: newUser.id,
                    firstName,
                    lastName,
                    DOB,
                    gender,
                    currentClassId: updatedAdmission.classId,
                    status: 'ACTIVE'
                }).returning();

            if (!newStudentRecord) {
                throw new Error("Failed to create student record");
            }

            // Assign Fees conditionally
            const feeStructures = await tx
                .select()
                .from(feeStructuresTable)
                .where(
                    and(
                        eq(feeStructuresTable.classId, updatedAdmission.classId),
                        eq(feeStructuresTable.academicYearId, updatedAdmission.academicYearId),
                        eq(feeStructuresTable.instituteId, targetInstituteId),
                        eq(feeStructuresTable.isCompulsory, true)
                    )
                );

            if (feeStructures.length > 0) {
                const assignments = feeStructures.map(feeStructure => {
                    const baseAmount = parseFloat(feeStructure.amount);
                    const discount = parseFloat("0");
                    const effectiveAmount = baseAmount - (baseAmount * discount / 100);

                    return {
                        studentId: newStudentRecord.id,
                        instituteId: targetInstituteId,
                        feeStructureId: feeStructure.id,
                        customAmount: null,
                        discountPercentage: null,
                        discountReason: 'none',
                        isWaived: false,
                        waivedReason: 'none',
                        effectiveAmount: effectiveAmount.toFixed(2),
                        assignedBy
                    };
                });

                const assignedFees = await tx
                    .insert(studentFeeAssignmentsTable)
                    .values(assignments)
                    .returning();

                if (!assignedFees || assignedFees.length === 0) {
                    throw new Error("Failed to assign compulsory fees to the student");
                }
            }

            const [parentsRecord] = await tx
                .insert(parentsTable)
                .values({
                    studentId: newStudentRecord.id,
                    instituteId: targetInstituteId,
                    fatherName,
                    motherName,
                    primaryPhone: phone,
                    address
                }).returning();

            if (!parentsRecord) {
                throw new Error("Failed to create parent record");
            }

            const [studentEnrollmentEntry] = await tx
                .insert(studentEnrollmentTable)
                .values({
                    studentId: newStudentRecord.id,
                    classId: updatedAdmission.classId,
                    sectionId: null,
                    academicYearId: updatedAdmission.academicYearId,
                    enrollmentDate: new Date().toISOString().split("T")[0] || "",
                    status: 'ACTIVE',
                }).returning();

            if (!studentEnrollmentEntry) {
                throw new Error("Failed to create student enrollment record");
            }

            return { newUser };
        });

        // Send credentials on Parent Email
        const sendCredentialsOnMail = await sendFirstTimeCredentialsEmail({
            parentEmail: email,
            studentName: firstName,
            temporaryPassword: autoGeneratedPassword,
            instituteId: targetInstituteId
        });

        if (!sendCredentialsOnMail.success) {
            console.warn("Email sending failed but admission approved:", sendCredentialsOnMail.message);
            return res.status(200).json({
                success: true,
                status: "APPROVED",
                message: "Admission approved successfully, but email notification could not be sent.",
                emailStatus: "FAILED",
                warning: "Email notification could not be sent. You may resend it later.",
                data: transactionResult.newUser
            });
        }

        return res.status(200).json({
            success: true,
            message: "Admission approved, student record created, fees assigned, and credentials sent to parent email",
            data: transactionResult.newUser
        });

    } catch (error: any) {
        console.error("Error approving admission: ", error);
        return res.status(500).json({
            message: error?.message || "Internal Server Error approving admission",
            status: 500,
        });
    }
}

// update the addmission status
const updateAddmissionStatus = async (req: Request, res: Response) => {
    try {
        const { instituteId: loggedInInstId, roles } = await getLoggedInUserDetails(req);
        const isSuperAdmin = roles.includes("SUPER_ADMIN");
        const { status, addmissionId } = req.body;

        if (!status || !addmissionId || !loggedInInstId) {
            return res.status(400).json({
                message: "Please provide required fields",
                status: 400
            })
        }

        const [addmission] = await db
            .select()
            .from(admissionsTable)
            .where(
                and(
                    eq(admissionsTable.id, addmissionId),
                    eq(admissionsTable.isDeleted, false)
                )
            ).limit(1);

        if (!addmission) {
            return res.status(404).json({
                message: "Addmission with the admissionId not found",
                status: 404
            })
        }

        if (!isSuperAdmin && addmission.instituteId !== loggedInInstId) {
            return res.status(403).json({ message: "Access denied. You do not have permission to manage this school's admissions.", status: 403 });
        }

        const [updateAddmissionStatus] = await db
            .update(admissionsTable)
            .set({
                applicationStatus: status
            })
            .where(eq(admissionsTable.id, addmissionId))
            .returning({
                admissionId: admissionsTable.id,
                instituteId: admissionsTable.instituteId,
                status: admissionsTable.applicationStatus
            });

        if (!updateAddmissionStatus) {
            return res.status(400).json({
                message: "failed to update the addmission application status",
                status: 400
            })
        }

        return res.status(200).json({
            message: "Admission status updated successfully",
            status: 200,
            data: updateAddmissionStatus
        })

    } catch (error) {
        console.log("Error updating addmission: ", error);
        return res.status(500).json({
            message: "Internal Server Error updating addmission",
            status: 500,
        });
    }
}

// Delete admission permanently (hard delete)
const deleteAddmission = async (req: Request, res: Response) => {
    try {
        const addmissionId = Number(req.params.addmissionId);
        const { instituteId: loggedInInstId, roles } = await getLoggedInUserDetails(req);
        const isSuperAdmin = roles.includes("SUPER_ADMIN");

        if (!addmissionId || (!isSuperAdmin && !loggedInInstId)) {
            return res.status(400).json({
                message: "Please provide valid fields",
                status: 400
            })
        }

        // Search the record regardless of soft delete state so it can be deleted from the archive/trash
        const [addmission] = await db
            .select()
            .from(admissionsTable)
            .where(eq(admissionsTable.id, addmissionId))
            .limit(1);

        if (!addmission) {
            return res.status(404).json({
                message: "Admission record not found",
                status: 404
            })
        }

        if (!isSuperAdmin && addmission.instituteId !== loggedInInstId) {
            return res.status(403).json({ message: "Access denied. You do not have permission to manage this school's admissions.", status: 403 });
        }

        const status = addmission.applicationStatus;

        // If approved, check if student is currently assigned to a class section
        if (status === "APPROVED" && addmission.userId) {
            const [student] = await db
                .select({ currentSectionId: studentsTable.currentSectionId })
                .from(studentsTable)
                .where(eq(studentsTable.userId, addmission.userId))
                .limit(1);

            if (student?.currentSectionId) {
                return res.status(400).json({
                    message: "Cannot permanently delete. Student is actively enrolled in a class section. Please unenroll them first.",
                    status: 400
                });
            }
        }

        // Run the deletion within a transaction block
        const deletedAdmission = await db.transaction(async (tx) => {
            if (addmission.userId) {
                // Deleting the user will cascade delete student, parents, fee assignments, invoices, enrollments
                await tx
                    .delete(usersTable)
                    .where(eq(usersTable.id, addmission.userId));
            }

            const [deleted] = await tx
                .delete(admissionsTable)
                .where(eq(admissionsTable.id, addmissionId))
                .returning();

            return deleted;
        });

        if (!deletedAdmission) {
            return res.status(400).json({
                message: "Failed to permanently delete the admission record",
                status: 400
            })
        }

        return res.status(200).json({
            message: `Admission entry permanently deleted. Status was: ${status}`,
            status: 200
        });

    } catch (error) {
        console.error("Error permanently deleting admission: ", error);
        return res.status(500).json({
            message: "Internal Server Error permanently deleting admission",
            status: 500,
        });
    }
}

const softDeleteAddmission = async (req: Request, res: Response) => {
    try {
        const admissionId = Number(req.params.admissionId);
        const { instituteId: loggedInInstId, roles, loggedInUserId: userId } = await getLoggedInUserDetails(req);
        const isSuperAdmin = roles.includes("SUPER_ADMIN");
        const { reason } = req.body || "none";

        if (!admissionId || (!isSuperAdmin && !loggedInInstId) || isNaN(admissionId)) {
            return res.status(400).json({
                message: "Valid admission ID is required",
                status: 400
            })
        }

        // Check if admission exists and not already deleted
        const [admission] = await db
            .select()
            .from(admissionsTable)
            .where(
                and(
                    eq(admissionsTable.id, admissionId),
                    eq(admissionsTable.isDeleted, false)
                )
            )
            .limit(1);

        if (!admission) {
            return res.status(404).json({
                success: false,
                message: "Admission not found or already deleted"
            });
        }

        if (!isSuperAdmin && admission.instituteId !== loggedInInstId) {
            return res.status(403).json({ message: "Access denied. You do not have permission to manage this school's admissions.", status: 403 });
        }

        // Check if approved and has enrolled student
        if (admission.applicationStatus === 'APPROVED' && admission.userId) {
            const [student] = await db
                .select({ currentSectionId: studentsTable.currentSectionId })
                .from(studentsTable)
                .where(eq(studentsTable.userId, admission.userId))
                .limit(1);

            if (student?.currentSectionId) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot delete. Student is enrolled. Please unenroll first."
                });
            }
        }

        // Soft delete - just mark as deleted
        const [deletedAdmission] = await db
            .update(admissionsTable)
            .set({
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: userId,
                deletionReason: reason || 'No reason provided'
            })
            .where(eq(admissionsTable.id, admissionId))
            .returning();

        // Also deactivate user if exists
        if (admission.userId) {
            await db
                .update(usersTable)
                .set({ isActive: false })
                .where(eq(usersTable.id, admission.userId));
        }

        return res.status(200).json({
            status: 200,
            message: "Admission soft deleted successfully",
            data: {
                admissionId: deletedAdmission?.id,
                deletedAt: deletedAdmission?.deletedAt
            }
        });


    } catch (error) {
        console.log("Error deleting addmission: ", error);
        return res.status(500).json({
            message: "Internal Server Error soft deleting addmission",
            status: 500,
        });
    }
}

const restoreAdmission = async (req: Request, res: Response) => {
    try {
        const admissionId = Number(req.params.admissionId);
        const { instituteId: loggedInInstId, roles } = await getLoggedInUserDetails(req);
        const isSuperAdmin = roles.includes("SUPER_ADMIN");

        if (!admissionId || !loggedInInstId) {
            return res.status(400).json({
                message: "Valid admission ID is required",
                status: 400
            })
        }

        const [admission] = await db
            .select()
            .from(admissionsTable)
            .where(
                and(
                    eq(admissionsTable.id, admissionId),
                    eq(admissionsTable.isDeleted, true)
                )
            )
            .limit(1);

        if (!admission) {
            return res.status(404).json({
                success: false,
                message: "Deleted admission not found"
            });
        }

        if (!isSuperAdmin && admission.instituteId !== loggedInInstId) {
            return res.status(403).json({ message: "Access denied. You do not have permission to manage this school's admissions.", status: 403 });
        }

        const [restored] = await db
            .update(admissionsTable)
            .set({
                isDeleted: false,
                deletedAt: null,
                deletedBy: null,
                deletionReason: null
            })
            .where(eq(admissionsTable.id, admissionId))
            .returning();

        // Reactivate user if exists
        if (admission.userId) {
            await db
                .update(usersTable)
                .set({ isActive: true })
                .where(eq(usersTable.id, admission.userId));
        }

        return res.status(200).json({
            status: 200,
            message: "Admission restored successfully",
            data: restored
        });

    } catch (error) {
        console.log("Error restoring addmission: ", error);
        return res.status(500).json({
            message: "Internal Server Error restoring addmission",
            status: 500,
        });
    }
}

// This will get all approved admissions for an institute in a particular academic year
const getAllAddmissions = async (req: Request, res: Response) => {
    try {
        const { instituteId: loggedInInstId, roles } = await getLoggedInUserDetails(req);
        const yearId = Number(req.params.yearId);

        let targetInstituteId = loggedInInstId;
        const isSuperAdmin = roles.includes("SUPER_ADMIN");

        if (isSuperAdmin && req.query.instituteId) {
            targetInstituteId = Number(req.query.instituteId);
        }

        if (!targetInstituteId || !yearId) {
            return res.status(400).json({ message: 'Please provide required fields', status: 400 });
        }

        const statusFilter = req.query.status as string;

        const conditions = [
            eq(admissionsTable.instituteId, targetInstituteId),
            eq(admissionsTable.isDeleted, false),
            eq(admissionsTable.academicYearId, yearId)
        ];

        if (statusFilter && statusFilter.toUpperCase() !== 'ALL') {
            conditions.push(eq(admissionsTable.applicationStatus, statusFilter.toUpperCase() as any));
        }

        const allAdmissions = await db
            .select({
                id: admissionsTable.id,
                academicYearId: admissionsTable.academicYearId,
                academicYearName: academicYearsTable.name,
                admissionDate: admissionsTable.admissionDate,
                instituteId: admissionsTable.instituteId,
                schoolName: instituteProfileTable.schoolName,
                userId: admissionsTable.userId,
                name: admissionsTable.name,
                board: admissionsTable.board,
                parentPhoneNo: admissionsTable.parentPhoneNo,
                applicationStatus: admissionsTable.applicationStatus,
                classId: admissionsTable.classId,
                className: classesTable.className,
                createdAt: admissionsTable.createdAt,
            })
            .from(admissionsTable)
            .leftJoin(classesTable, eq(admissionsTable.classId, classesTable.id))
            .leftJoin(academicYearsTable, eq(admissionsTable.academicYearId, academicYearsTable.id))
            .leftJoin(instituteProfileTable, eq(admissionsTable.instituteId, instituteProfileTable.id))
            .where(and(...conditions));

        return res.status(200).json({
            message: `Admissions retrieved successfully`,
            data: allAdmissions,
            status: 200
        });

    } catch (error) {
        console.error("Error getting all admissions:", error);
        return res.status(500).json({
            message: "Internal Server Error getting all admissions",
            status: 500,
        });
    }
}

const getAddmission = async (req: Request, res: Response) => {
    try {
        const { instituteId: loggedInInstId, roles } = await getLoggedInUserDetails(req);
        const isSuperAdmin = roles.includes("SUPER_ADMIN");
        const addmissionId = Number(req.params.addmissionId);

        if (!addmissionId || !loggedInInstId) {
            return res.status(400).json({
                message: 'Please provide required fields',
                status: 400
            });
        }

        const [addmission] = await db
            .select({
                id: admissionsTable.id,
                academicYearId: admissionsTable.academicYearId,
                academicYearName: academicYearsTable.name,
                admissionDate: admissionsTable.admissionDate,
                instituteId: admissionsTable.instituteId,
                schoolName: instituteProfileTable.schoolName,
                userId: admissionsTable.userId,
                name: admissionsTable.name,
                board: admissionsTable.board,
                parentPhoneNo: admissionsTable.parentPhoneNo,
                applicationStatus: admissionsTable.applicationStatus,
                classId: admissionsTable.classId,
                className: classesTable.className,
                createdAt: admissionsTable.createdAt,
            })
            .from(admissionsTable)
            .leftJoin(classesTable, eq(admissionsTable.classId, classesTable.id))
            .leftJoin(academicYearsTable, eq(admissionsTable.academicYearId, academicYearsTable.id))
            .leftJoin(instituteProfileTable, eq(admissionsTable.instituteId, instituteProfileTable.id))
            .where(
                and(
                    eq(admissionsTable.id, addmissionId),
                    eq(admissionsTable.isDeleted, false)
                )
            ).limit(1);

        if (!addmission) {
            return res.status(404).json({
                message: "No admission found for this ID",
                status: 404
            });
        }

        if (!isSuperAdmin && addmission.instituteId !== loggedInInstId) {
            return res.status(403).json({ message: "Access denied. You do not have permission to view this admission.", status: 403 });
        }

        return res.status(200).json({
            message: "Addmission found",
            data: addmission,
            status: 200
        });

    } catch (error) {
        console.log("Error getting specific addmission: ", error);
        return res.status(500).json({
            message: "Internal Server Error getting specific addmission",
            status: 500,
        });
    }
}

export {
    createAddmission,
    updateAddmissionStatus,
    deleteAddmission,
    softDeleteAddmission,
    getAddmission,
    getAllAddmissions,
    approveAddmission,
    restoreAdmission
};