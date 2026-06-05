import type { Request, Response } from "express";
import { db } from "../db";
import { academicYearsTable, instituteProfileTable, rolesTable, userRoleTable, usersTable, studentsTable, parentsTable } from "../models";
import { and, eq, sql } from "drizzle-orm";
import type { BankDetails, TokenUser } from "../interface";
import bcrypt from "bcrypt";
import { staffTable, teacherProfileTable } from "../models/staff/staff.model";
import { getLoggedInUserDetails } from "../services/auth.service";

const createAcademicYear = async (req: Request, res: Response) => {
    try {
        const { name, startDate, endDate, isActive } = req.body;
        const { instituteId } = await getLoggedInUserDetails(req);

        // Validation
        if (!name || !startDate || !endDate || !instituteId) {
            return res.status(400).json({
                message: "Name, startDate, endDate, and instituteId are required",
                status: 400,
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
        return res.status(500).json({
            message: "Internal Server Error creating academic year",
            status: 500,
        });
    }
};

const createStaff = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, phone, gender, password, isActive, roleName, employeeCode, designation, joiningDate, salaryBasic, bankName, bankAccHolderName, bankAccNo, bankIFSC, bankBranchName, bankAccType, upiId } = req.body;

        const { instituteId } = await getLoggedInUserDetails(req);
        console.log("🚀 ~ createStaff ~ instituteId:", instituteId)

        if ([firstName, lastName, email, phone, gender, password, roleName, employeeCode, designation, joiningDate, bankName, bankAccHolderName, bankAccNo, bankIFSC, bankAccType,].some((field) => !field || field?.trim() === "")
        ) {
            return res
                .status(400)
                .json({
                    message: "Please check if all the required fields are provided",
                    status: 400,
                });
        }

        const bankDetails: BankDetails = {
            bankName,
            bankAccHolderName,
            bankAccNo,
            bankIFSC,
            bankBranchName,
            bankAccType,
            upiId,
        };

        const [existingUser] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);

        // TODO: if the user with this email already exist then create a new api where you can just add that user to the StaffTable

        if (existingUser) {
            return res
                .status(400)
                .json({ message: "User with this email already exists", status: 400 });
        }

        if (roleName === "SUPER_ADMIN") {
            return res
                .status(403)
                .json({ status: 403, message: "You Cannot assign SUPER_ADMIN role" });
        }

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

        const encryptedPassword = bcrypt
            .hashSync(password, Number(process.env.SALT_ROUNDS))
            .toString();

        const [newUser] = await db
            .insert(usersTable)
            .values({
                firstName,
                lastName,
                instituteId,
                email,
                phone,
                gender,
                password_hash: encryptedPassword,
                isActive,
            }).returning();

        if (!newUser) {
            return res
                .status(500)
                .json({ message: "Failed to create user", status: 500 });
        }

        const assignedBy = (req.user && typeof req.user !== "string" && "id" in req.user) ? (req.user as TokenUser).id : undefined;

        const [userRoleAssignment] = await db.insert(userRoleTable).values({
            userId: newUser.id,         // The user we just created
            roleId: targetRole.id,      // The role they should have (TEACHER, ACCOUNTANT, etc.)
            assignedBy: assignedBy, // The admin who is assigning this role
        }).returning();

        if (!userRoleAssignment) {
            // Rollback: Delete the user if role assignment fails
            await db.delete(usersTable).where(eq(usersTable.id, newUser.id));
            return res
                .status(500)
                .json({ status: 500, message: "Failed to assign role to user" });
        }

        const [newStaff] = await db
            .insert(staffTable)
            .values({
                userId: newUser.id,
                instituteId,
                employeeCode,
                firstName,
                lastName,
                designation,
                joiningDate,
                salaryBasic,
                bankDetails,
            }).returning();

        if (!newStaff) {
            // Rollback: Delete the user and user role assignment if staff creation fails
            await db.delete(userRoleTable).where(eq(userRoleTable.userId, newUser.id));
            await db.delete(usersTable).where(eq(usersTable.id, newUser.id));
            return res
                .status(500)
                .json({ status: 500, message: "Failed to create staff record" });
        }

        if (roleName === "TEACHER") {
            // Create teacher profile entry
            try {
                await db.insert(teacherProfileTable).values({
                    staffId: newStaff.id,
                    instituteId: instituteId
                })
            } catch (error) {
                console.error("Error creating teacher profile: ", error);
                // Rollback: Delete the staff, user role assignment, and user if teacher profile creation fails
                await db.delete(staffTable).where(eq(staffTable.id, newStaff.id));
                await db.delete(userRoleTable).where(eq(userRoleTable.userId, newUser.id));
                await db.delete(usersTable).where(eq(usersTable.id, newUser.id));
                return res
                    .status(500)
                    .json({ status: 500, message: "Failed to create teacher profile" });
            }
        }

        return res.status(201).json({
            success: true,
            message: `Staff created successfully with ${roleName} role`,
            data: {
                user: newUser.id,
                staff: newStaff.id,
                role: targetRole.name,
                schoolId: instituteId,
            },
        });

    } catch (error) {
        console.error("Error creating Staff : ", error);
        return res
            .status(500)
            .json({
                message: "Internal Server Error creating/adding staff",
                status: 500,
            });
    }
};

const getStaffByInstitute = async (req: Request, res: Response) => {
    try {
        const { instituteId } = await getLoggedInUserDetails(req);

        if (!instituteId) {
            return res.status(400).json({
                message: "Institute ID is required and must be a valid number",
                status: 400,
            });
        }

        const staffMembers = await db
            .select()
            .from(staffTable)
            .where(eq(staffTable.instituteId, instituteId));

        return res.status(200).json({
            message: "Staff members fetched successfully",
            status: 200,
            data: staffMembers,
        });


    } catch (error) {
        console.error("Error fetching staff by school: ", error);
        return res.status(500).json({
            message: "Internal Server Error fetching staff by school",
            status: 500,
        });
    }
}

const getAcademicYears = async (req: Request, res: Response) => {
    try {
        const { instituteId: loggedInInstId, isSuperAdmin } = await getLoggedInUserDetails(req);
        const targetInstituteId = isSuperAdmin && req.query.instituteId ? Number(req.query.instituteId) : loggedInInstId;

        if (!targetInstituteId) {
            return res.status(400).json({
                message: "Institute ID is required and must be a valid number",
                status: 400,
            });
        }

        const academicYears = await db
            .select()
            .from(academicYearsTable)
            .where(eq(academicYearsTable.instituteId, targetInstituteId))
            .orderBy(academicYearsTable.id);

        return res.status(200).json({
            message: "Academic years fetched successfully",
            status: 200,
            data: academicYears,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error fetching academic years",
            status: 500,
        });
    }
}

// Getting all school Admins for superAdmin
const getAllSchoolAdmins = async (req: Request, res: Response) => {
    try {
        const { roles } = await getLoggedInUserDetails(req);

        if (!roles.includes('SUPER_ADMIN')) {
            return res.status(401).json({ message: "Unauthorized", status: 401 });
        }

        const [schoolAdminRole] = await db
            .select({ id: rolesTable.id })
            .from(rolesTable)
            .where(
                and(
                    eq(rolesTable.name, 'SCHOOL_ADMIN'),
                    eq(rolesTable.isSystemRole, true)
                )
            )
            .limit(1);

        if (!schoolAdminRole) {
            return res.status(404).json({ message: "SCHOOL_ADMIN role not found", status: 404 });
        }

        const schoolAdmins = await db
            .select({
                userId: usersTable.id,
                firstName: usersTable.firstName,
                lastName: usersTable.lastName,
                email: usersTable.email,
                phone: usersTable.phone,
                isActive: usersTable.isActive,
                schoolId: instituteProfileTable.id,
                schoolInfo: instituteProfileTable.contactInfo,
                schoolName: instituteProfileTable.schoolName,
                affiliationNumber: instituteProfileTable.affiliationNumber,
                schoolSlug: instituteProfileTable.slug,
                schoolStatus: instituteProfileTable.status,
                assignedAt: userRoleTable.assignedAt,
            })
            .from(instituteProfileTable)
            .leftJoin(userRoleTable, eq(userRoleTable.roleId, schoolAdminRole.id)) // ← only SCHOOL_ADMIN role rows
            .leftJoin(usersTable,
                and(
                    eq(userRoleTable.userId, usersTable.id),
                    eq(usersTable.instituteId, instituteProfileTable.id) // ← admin must belong to THIS school
                )
            );

        if (schoolAdmins.length === 0) {
            return res.status(404).json({ message: "No school admins found", status: 404 });
        }

        // Group by school
        const grouped = schoolAdmins.reduce((acc, row) => {
            const key = row.schoolId;
            if (!acc[key]) {
                acc[key] = {
                    schoolId: row.schoolId,
                    schoolName: row.schoolName,
                    schoolSlug: row.schoolSlug,
                    schoolStatus: row.schoolStatus,
                    schoolInfo: row.schoolInfo,
                    affiliationNumber: row.affiliationNumber,
                    admins: []
                };
            }

            // Only push if an actual admin exists for this school
            if (row.userId) {
                acc[key].admins.push({
                    userId: row.userId,
                    firstName: row.firstName,
                    lastName: row.lastName,
                    email: row.email,
                    phone: row.phone,
                    isActive: row.isActive,
                    assignedAt: row.assignedAt,
                });
            }

            return acc;
        }, {} as Record<number, any>);

        return res.status(200).json({
            message: "School admins fetched successfully",
            data: Object.values(grouped),
            status: 200
        });

    } catch (error) {
        console.error("Error fetching school admins:", error);
        return res.status(500).json({ message: "Internal Server Error", status: 500 });
    }
}

const getSchoolAdmins = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;

        if (!slug) {
            return res.status(400).json({ message: "School slug is required", status: 400 });
        }

        const school = await db
            .select({ id: instituteProfileTable.id })
            .from(instituteProfileTable)
            .where(eq(instituteProfileTable.slug, slug))
            .limit(1);

        if (!school) {
            return res.status(404).json({ message: "School not found", status: 404 });
        }

        const schoolId = school[0]?.id;

        if (!schoolId) {
            return res.status(404).json({ message: "School ID not found", status: 404 });
        }

        const schoolAdmins = await db
            .select({
                userId: usersTable.id,
                firstName: usersTable.firstName,
                lastName: usersTable.lastName,
                email: usersTable.email,
                phone: usersTable.phone,
                isActive: usersTable.isActive,
                assignedAt: userRoleTable.assignedAt,
            })
            .from(usersTable)
            .innerJoin(
                userRoleTable,
                eq(userRoleTable.userId, usersTable.id)
            )
            .innerJoin(
                rolesTable,
                eq(rolesTable.id, userRoleTable.roleId)
            )
            .where(
                and(
                    eq(usersTable.instituteId, schoolId),
                    eq(rolesTable.name, 'SCHOOL_ADMIN'),
                    eq(rolesTable.isSystemRole, true)
                )
            );

        if (schoolAdmins.length === 0) {
            return res.status(200).json({ message: "No admins found for this school", status: 200, data: [] });
        }

        const totalAdmins = schoolAdmins.length;
        const totalActiveAdmins = schoolAdmins.filter(a => a.isActive).length;

        return res.status(200).json({
            message: "School admins fetched successfully",
            data: schoolAdmins,
            totalAdmins,
            totalActiveAdmins,
            status: 200
        });
    } catch (error) {
        console.error("Error fetching school admins:", error);
        return res.status(500).json({ message: "Internal Server Error Getting School Admins", status: 500 });
    }
}

const getUnifiedSchoolDirectory = async (req: Request, res: Response) => {
    try {
        const { instituteId: loggedInInstId, roles } = await getLoggedInUserDetails(req);

        let targetInstituteId = loggedInInstId;
        const isSuperAdmin = roles.includes("SUPER_ADMIN");

        if (isSuperAdmin && req.query.instituteId) {
            targetInstituteId = Number(req.query.instituteId);
        }

        if (!targetInstituteId || isNaN(targetInstituteId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing instituteId",
                status: 400
            });
        }

        // 1. Fetch all users from usersTable for targetInstituteId with role and optional staff/student links
        const allUsersList = await db
            .select({
                userId: usersTable.id,
                firstName: usersTable.firstName,
                lastName: usersTable.lastName,
                email: usersTable.email,
                phone: usersTable.phone,
                isActive: usersTable.isActive,
                roleName: rolesTable.name,
                
                // Staff details
                staffId: staffTable.id,
                employeeCode: staffTable.employeeCode,
                designation: staffTable.designation,

                // Student details
                studentId: studentsTable.id,
                admissionNo: studentsTable.admissionNo,
                rollNo: studentsTable.rollNo,
                studentStatus: studentsTable.status,
            })
            .from(usersTable)
            .leftJoin(userRoleTable, eq(userRoleTable.userId, usersTable.id))
            .leftJoin(rolesTable, eq(rolesTable.id, userRoleTable.roleId))
            .leftJoin(staffTable, eq(staffTable.userId, usersTable.id))
            .leftJoin(studentsTable, eq(studentsTable.userId, usersTable.id))
            .where(eq(usersTable.instituteId, targetInstituteId));

        // Group by userId to handle any potential multi-role duplicates
        const userMap = new Map<string, any>();
        allUsersList.forEach((u) => {
            if (userMap.has(u.userId)) {
                const existing = userMap.get(u.userId);
                if (u.roleName && !existing.roleNames.includes(u.roleName)) {
                    existing.roleNames.push(u.roleName);
                }
                return;
            }
            userMap.set(u.userId, {
                ...u,
                roleNames: u.roleName ? [u.roleName] : []
            });
        });

        // 2. Fetch Parents roster
        const parentsList = await db
            .select({
                id: parentsTable.id,
                fatherName: parentsTable.fatherName,
                motherName: parentsTable.motherName,
                primaryPhone: parentsTable.primaryPhone,
                fatherEmail: parentsTable.fatherEmail,
                studentId: parentsTable.studentId,
            })
            .from(parentsTable)
            .where(eq(parentsTable.instituteId, targetInstituteId));

        // 3. Build unified list
        const unifiedUsers: any[] = [];

        userMap.forEach((u) => {
            const primaryRole = u.roleNames[0] || "USER";

            // Student Case
            if (u.studentId) {
                // Keep only ACTIVE status students as per previous requirements
                if (u.studentStatus !== 'ACTIVE') {
                    return;
                }
                unifiedUsers.push({
                    id: u.studentId + 20000,
                    userId: u.userId,
                    firstName: u.firstName || "Student",
                    lastName: u.lastName || "Member",
                    employeeCode: u.admissionNo ? `ADM-${u.admissionNo}` : `STUD-${u.studentId}`,
                    designation: `Student (Roll No: ${u.rollNo || "N/A"})`,
                    email: u.email,
                    phone: u.phone || "N/A",
                    roleName: "STUDENT",
                    isActive: u.isActive !== false
                });
            }
            // Staff Case
            else if (u.staffId) {
                unifiedUsers.push({
                    id: u.staffId,
                    userId: u.userId,
                    firstName: u.firstName || "Staff",
                    lastName: u.lastName || "Member",
                    employeeCode: u.employeeCode || `EMP-${u.staffId}`,
                    designation: u.designation || "Staff",
                    email: u.email,
                    phone: u.phone || "N/A",
                    roleName: primaryRole,
                    isActive: u.isActive !== false
                });
            }
            // Other System users (e.g. SCHOOL_ADMIN)
            else {
                // Ignore SUPER_ADMIN from school local directory
                if (primaryRole === "SUPER_ADMIN") {
                    return;
                }
                unifiedUsers.push({
                    id: u.userId, // UUID is unique and works perfectly as React key
                    userId: u.userId,
                    firstName: u.firstName || "User",
                    lastName: u.lastName || "Member",
                    employeeCode: `ADM-${u.userId.substring(0, 8).toUpperCase()}`,
                    designation: primaryRole === "SCHOOL_ADMIN" ? "School Administrator" : (primaryRole || "User"),
                    email: u.email,
                    phone: u.phone || "N/A",
                    roleName: primaryRole,
                    isActive: u.isActive !== false
                });
            }
        });

        // Map Parents
        parentsList.forEach((p) => {
            unifiedUsers.push({
                id: p.id + 40000,
                userId: null,
                firstName: "Parent of",
                lastName: p.fatherName || p.motherName || "Student",
                employeeCode: `PAR-${p.id}`,
                designation: "Parent / Guardian",
                email: p.fatherEmail || `parent.${p.id}@school.com`,
                phone: p.primaryPhone || "N/A",
                roleName: "PARENT",
                isActive: true
            });
        });

        return res.status(200).json({
            success: true,
            message: "Unified directory retrieved successfully",
            data: unifiedUsers,
            status: 200
        });

    } catch (error: any) {
        console.error("Error in getUnifiedSchoolDirectory:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error loading directory",
            error: error.message,
            status: 500
        });
    }
};

const updateAcademicYearStatus = async (req: Request, res: Response) => {
    try {
        const { id, isActive } = req.body;
        const { instituteId, roles } = await getLoggedInUserDetails(req);

        if (!roles.includes('SUPER_ADMIN')) {
            return res.status(403).json({
                message: "Unauthorized. Only Super Admins can manage academic year statuses.",
                status: 403,
            });
        }

        if (id === undefined || id === null || !instituteId) {
            return res.status(400).json({
                message: "Academic Year ID is required",
                status: 400,
            });
        }

        // Validate the academic year exists and belongs to this institute
        const year = await db
            .select()
            .from(academicYearsTable)
            .where(
                and(
                    eq(academicYearsTable.id, id),
                    eq(academicYearsTable.instituteId, instituteId)
                )
            )
            .limit(1);

        if (year.length === 0) {
            return res.status(404).json({
                message: "Academic year not found for this institute",
                status: 404,
            });
        }

        // If setting active, deactivate all other years of this institute first
        if (isActive) {
            await db
                .update(academicYearsTable)
                .set({ isActive: false })
                .where(eq(academicYearsTable.instituteId, instituteId));
        }

        // Update target year status
        const [updatedYear] = await db
            .update(academicYearsTable)
            .set({ isActive })
            .where(
                and(
                    eq(academicYearsTable.id, id),
                    eq(academicYearsTable.instituteId, instituteId)
                )
            )
            .returning();

        return res.status(200).json({
            message: `Academic year marked as ${isActive ? "active" : "inactive"} successfully`,
            status: 200,
            data: updatedYear,
        });

    } catch (error) {
        console.error("Error updating academic year status: ", error);
        return res.status(500).json({
            message: "Internal Server Error updating academic year status",
            status: 500,
        });
    }
};

export { createAcademicYear, createStaff, getStaffByInstitute, getAcademicYears, getAllSchoolAdmins, getSchoolAdmins, getUnifiedSchoolDirectory, updateAcademicYearStatus };


// TODOS : Automate the creation of next academic year based on current year end date. (Future Feature)
// 1. Admin clicks ONE button: "Setup Next Academic Year"
// 2. System automatically:
// - Creates academic year
//     - Clones ALL classes from current year
//         - Clones ALL sections
//             - Assigns default subjects
// 3. Admin reviews and confirms
// 4. Admin clicks: "Promote All Students"
// 5. System promotes everyone automatically
// 6. Admin manually adjusts exceptions(detained students)