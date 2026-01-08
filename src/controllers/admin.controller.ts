import type { Request, Response } from "express";
import { db } from "../db";
import { academicYearsTable, rolesTable, userRoleTable, usersTable } from "../models";
import { and, eq } from "drizzle-orm";
import type { BankDetails, TokenUser } from "../interface";
import bcrypt from "bcrypt";
import { staffTable, teacherProfileTable } from "../models/staff/staff.model";

const createAcademicYear = async (req: Request, res: Response) => {
    try {
        const { name, startDate, endDate, isActive } = req.body;
        const loggedInUser = req.user as TokenUser;
        const instituteId = Number(loggedInUser?.instituteId);

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

        const loggedInUser = req.user as TokenUser;
        const instituteId = Number(loggedInUser?.instituteId);

        if ([firstName, lastName, instituteId, email, phone, gender, password, roleName, employeeCode, designation, joiningDate, bankName, bankAccHolderName, bankAccNo, bankIFSC, bankAccType,].some((field) => !field || field.trim() === "")
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

        if (!existingUser) {
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
        const loggedInUser = req.user as TokenUser;
        const instituteId = Number(loggedInUser?.instituteId);

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

export { createAcademicYear, createStaff, getStaffByInstitute };


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