import type { Request, Response } from "express";
import { db } from "../db";
import {
    usersTable,
    staffTable,
    teacherProfileTable,
    rolesTable,
    userRoleTable,
    instituteProfileTable
} from "../models";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { getLoggedInUserDetails } from "../services/auth.service";

// 1. Get all teachers with profile details
export const getTeachers = async (req: Request, res: Response) => {
    try {
        const { instituteId: loggedInInstId, roles } = await getLoggedInUserDetails(req);
        const isSuperAdmin = roles.includes("SUPER_ADMIN");
        let targetInstituteId = loggedInInstId;

        if (isSuperAdmin && req.query.instituteId) {
            targetInstituteId = Number(req.query.instituteId);
        }

        if (!targetInstituteId || isNaN(targetInstituteId)) {
            return res.status(400).json({
                success: false,
                message: "Valid institute ID is required",
                status: 400
            });
        }

        const teachers = await db
            .select({
                userId: usersTable.id,
                firstName: usersTable.firstName,
                lastName: usersTable.lastName,
                email: usersTable.email,
                phone: usersTable.phone,
                gender: usersTable.gender,
                isActive: usersTable.isActive,

                staffId: staffTable.id,
                employeeCode: staffTable.employeeCode,
                designation: staffTable.designation,
                department: staffTable.department,
                joiningDate: staffTable.joiningDate,
                salaryBasic: staffTable.salaryBasic,
                bankDetails: staffTable.bankDetails,

                teacherProfileId: teacherProfileTable.id,
                qualification: teacherProfileTable.qualification,
                majorSubjects: teacherProfileTable.majorSubjects,
                weeklyWorkloadLimit: teacherProfileTable.weeklyWorkloadLimit,
                isClassTeacher: teacherProfileTable.isClassTeacher,
                schoolName: instituteProfileTable.schoolName
            })
            .from(teacherProfileTable)
            .leftJoin(staffTable, eq(teacherProfileTable.staffId, staffTable.id))
            .leftJoin(usersTable, eq(staffTable.userId, usersTable.id))
            .leftJoin(instituteProfileTable, eq(teacherProfileTable.instituteId, instituteProfileTable.id))
            .where(eq(teacherProfileTable.instituteId, targetInstituteId));

        return res.status(200).json({
            success: true,
            message: "Teachers retrieved successfully",
            status: 200,
            data: teachers
        });
    } catch (error) {
        console.error("Error in getTeachers:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error retrieving teachers",
            status: 500
        });
    }
};

// 2. Create a new teacher
export const createTeacher = async (req: Request, res: Response) => {
    try {
        const { instituteId: loggedInInstId, roles, loggedInUserId } = await getLoggedInUserDetails(req);
        const isSuperAdmin = roles.includes("SUPER_ADMIN");

        const {
            firstName,
            lastName,
            email,
            phone,
            gender,
            password,
            employeeCode,
            designation,
            department,
            joiningDate,
            salaryBasic,
            bankDetails,
            qualification,
            majorSubjects,
            isClassTeacher,
            reqInstId
        } = req.body;

        const targetInstituteId = (isSuperAdmin && reqInstId) ? Number(reqInstId) : loggedInInstId;

        if (!targetInstituteId) {
            return res.status(400).json({
                success: false,
                message: "Valid institute ID is required",
                status: 400
            });
        }

        if (!firstName || !lastName || !email || !phone || !gender || !password || !employeeCode || !joiningDate || !salaryBasic) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all required fields",
                status: 400
            });
        }

        // Check if email already exists
        const [existingUser] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email is already registered in the system",
                status: 400
            });
        }

        // Fetch TEACHER role
        const [teacherRole] = await db
            .select({ id: rolesTable.id })
            .from(rolesTable)
            .where(eq(rolesTable.name, "TEACHER"))
            .limit(1);

        if (!teacherRole) {
            return res.status(404).json({
                success: false,
                message: "System role 'TEACHER' not found",
                status: 404
            });
        }

        const encryptedPassword = bcrypt.hashSync(password, Number(process.env.SALT_ROUNDS || 10));

        // Create user, role assignment, staff, and teacher profile in a transaction
        const result = await db.transaction(async (tx) => {
            const [newUser] = await tx
                .insert(usersTable)
                .values({
                    firstName,
                    lastName,
                    instituteId: targetInstituteId,
                    email,
                    phone,
                    gender,
                    password_hash: encryptedPassword,
                    isActive: true
                })
                .returning();

            if (!newUser) {
                throw new Error("Failed to register user credentials");
            }

            await tx.insert(userRoleTable).values({
                userId: newUser.id,
                roleId: teacherRole.id,
                assignedBy: loggedInUserId
            });

            const [newStaff] = await tx
                .insert(staffTable)
                .values({
                    userId: newUser.id,
                    instituteId: targetInstituteId,
                    employeeCode,
                    firstName,
                    lastName,
                    designation: designation || "Teacher",
                    department: department || "Academic",
                    joiningDate,
                    salaryBasic: String(salaryBasic),
                    bankDetails: bankDetails || {}
                })
                .returning();

            if (!newStaff) {
                throw new Error("Failed to register staff record");
            }

            const [newTeacherProfile] = await tx
                .insert(teacherProfileTable)
                .values({
                    staffId: newStaff.id,
                    instituteId: targetInstituteId,
                    qualification: qualification || [],
                    majorSubjects: majorSubjects || [],
                    isClassTeacher: !!isClassTeacher
                })
                .returning();

            return {
                userId: newUser.id,
                staffId: newStaff.id,
                teacherProfileId: newTeacherProfile?.id
            };
        });

        return res.status(201).json({
            success: true,
            message: "Teacher account and profile created successfully",
            status: 201,
            data: result
        });
    } catch (error) {
        console.error("Error creating teacher:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error creating teacher profile",
            status: 500
        });
    }
};

// 3. Update an existing teacher
export const updateTeacher = async (req: Request, res: Response) => {
    try {
        const { instituteId: loggedInInstId, roles } = await getLoggedInUserDetails(req);
        const isSuperAdmin = roles.includes("SUPER_ADMIN");
        const targetUserId = req.params.userId;

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: "User ID parameter is required",
                status: 400
            });
        }

        // Fetch existing staff/user to verify permissions
        const [existingUser] = await db
            .select({
                id: usersTable.id,
                instituteId: usersTable.instituteId
            })
            .from(usersTable)
            .where(eq(usersTable.id, targetUserId))
            .limit(1);

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "Teacher user not found",
                status: 404
            });
        }

        if (!isSuperAdmin && existingUser.instituteId !== loggedInInstId) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You do not have permission to manage this teacher.",
                status: 403
            });
        }

        const {
            firstName,
            lastName,
            email,
            phone,
            gender,
            password,
            employeeCode,
            designation,
            department,
            joiningDate,
            salaryBasic,
            bankDetails,
            qualification,
            majorSubjects,
            isClassTeacher,
            isActive
        } = req.body;

        // Perform updates in transaction
        await db.transaction(async (tx) => {
            // Update User details
            const userUpdatePayload: any = {
                firstName,
                lastName,
                email,
                phone,
                gender,
                isActive: isActive !== undefined ? !!isActive : undefined
            };

            if (password) {
                userUpdatePayload.password_hash = bcrypt.hashSync(password, Number(process.env.SALT_ROUNDS || 10));
            }

            // Clean undefined values
            Object.keys(userUpdatePayload).forEach(key => userUpdatePayload[key] === undefined && delete userUpdatePayload[key]);

            await tx
                .update(usersTable)
                .set(userUpdatePayload)
                .where(eq(usersTable.id, targetUserId));

            // Update Staff details
            const [staff] = await tx
                .select({ id: staffTable.id })
                .from(staffTable)
                .where(eq(staffTable.userId, targetUserId))
                .limit(1);

            if (staff) {
                const staffUpdatePayload: any = {
                    employeeCode,
                    firstName,
                    lastName,
                    designation,
                    department,
                    joiningDate,
                    salaryBasic: salaryBasic !== undefined ? String(salaryBasic) : undefined,
                    bankDetails
                };

                Object.keys(staffUpdatePayload).forEach(key => staffUpdatePayload[key] === undefined && delete staffUpdatePayload[key]);

                await tx
                    .update(staffTable)
                    .set(staffUpdatePayload)
                    .where(eq(staffTable.id, staff.id));

                // Update Teacher Profile details
                const teacherProfilePayload: any = {
                    qualification,
                    majorSubjects,
                    isClassTeacher: isClassTeacher !== undefined ? !!isClassTeacher : undefined
                };

                Object.keys(teacherProfilePayload).forEach(key => teacherProfilePayload[key] === undefined && delete teacherProfilePayload[key]);

                await tx
                    .update(teacherProfileTable)
                    .set(teacherProfilePayload)
                    .where(eq(teacherProfileTable.staffId, staff.id));
            }
        });

        return res.status(200).json({
            success: true,
            message: "Teacher details updated successfully",
            status: 200
        });
    } catch (error) {
        console.error("Error updating teacher:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error updating teacher details",
            status: 500
        });
    }
};

// 4. Toggle active status (Soft delete / Deactivate)
export const toggleTeacherStatus = async (req: Request, res: Response) => {
    try {
        const { instituteId: loggedInInstId, roles } = await getLoggedInUserDetails(req);
        const isSuperAdmin = roles.includes("SUPER_ADMIN");
        const targetUserId = req.params.userId;

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: "User ID parameter is required",
                status: 400
            });
        }

        const [existingUser] = await db
            .select({
                id: usersTable.id,
                instituteId: usersTable.instituteId,
                isActive: usersTable.isActive
            })
            .from(usersTable)
            .where(eq(usersTable.id, targetUserId))
            .limit(1);

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "Teacher user not found",
                status: 404
            });
        }

        if (!isSuperAdmin && existingUser.instituteId !== loggedInInstId) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You do not have permission to manage this teacher.",
                status: 403
            });
        }

        const newStatus = !existingUser.isActive;

        await db
            .update(usersTable)
            .set({ isActive: newStatus })
            .where(eq(usersTable.id, targetUserId));

        return res.status(200).json({
            success: true,
            message: `Teacher ${newStatus ? "activated" : "deactivated"} successfully`,
            status: 200,
            data: { isActive: newStatus }
        });
    } catch (error) {
        console.error("Error toggling teacher status:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error toggling status",
            status: 500
        });
    }
};
