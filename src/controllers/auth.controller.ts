import type { Request, Response } from "express";
import { db } from "../db";
import { permissionsTable, resetPasswordTable, rolePermissionTable, rolesTable, userRoleTable, usersTable } from "../models";
import { eq } from "drizzle-orm";
import { uploadImageToCloudinary } from "../helpers/uploadToCloudinary";
import bcrypt from 'bcrypt'
import { generateAccessToken, generateRefreshToken } from "../helpers/tokenGenerator";
import type { TokenUser } from "../interface";
import { sendEmail } from "../helpers/emailSender";

const signupUser = async (req: Request, res: Response) => {
    try {

        // STEP 1: EXTRACT DATA FROM REQUEST
        const { firstName, lastName, instituteId, email, phone, gender, password, isActive, roleName } = req.body;

        // STEP 2: VALIDATE REQUIRED FIELDS
        if ([firstName, lastName, email, phone, gender, password, roleName].some(field => field.trim() === "" || !field)) {
            return res.status(400).json({ status: 400, message: "Provide all required fields" });
        }

        // Check if instituteId is provided
        if (!instituteId) {
            return res.status(400).json({ status: 400, message: "Institute Id is required" });
        }

        // STEP 3: CHECK IF USER ALREADY EXISTS
        // Query database to see if email is already registered
        const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));

        if (existingUser) {
            return res.status(409).json({ message: "User with this email already exists!", status: 409 });
        }

        // STEP 4: PREVENT SUPER_ADMIN ASSIGNMENT VIA SIGNUP
        if (roleName === "SUPER_ADMIN") {
            return res.status(403).json({ status: 403, message: "You Cannot assign SUPER_ADMIN role" });
        }

        // CHECKING IF ROLE EXISTS IN DB
        // Check if the requested role (e.g., "TEACHER", "SCHOOL_ADMIN") exists
        const [targetRole] = await db.select({ id: rolesTable.id, name: rolesTable.name }).from(rolesTable).where(eq(rolesTable.name, roleName)).limit(1);

        if (!targetRole) {
            return res.status(404).json({ status: 404, message: `Role '${roleName}' not found in the database.` });
        }

        // STEP 6: HANDLE PROFILE IMAGE UPLOAD
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const profileImageLocalPath = files?.profileImage?.[0]?.path;

        if (!profileImageLocalPath) {
            return res.status(400).json({ message: "Profile-image file is missing" })
        }

        // STEP 7: ENCRYPT PASSWORD
        const encryptedPassword = bcrypt.hashSync(password, Number(process.env.SALT_ROUNDS)).toString();

        // STEP 8: UPLOAD IMAGE TO CLOUDINARY
        // Upload profile image to cloud storage
        const profileImage = await uploadImageToCloudinary(profileImageLocalPath, "School_Erp_Profile_Images");

        if (!profileImage) {
            return res.status(500).json({ message: "Failed to upload profileImage " });
        }

        // STEP 9: CREATE USER IN DATABASE
        // Insert new user into usersTable
        const [newUser] = await db.insert(usersTable).values({
            firstName,
            lastName,
            instituteId,
            profileImage: profileImage?.secure_url,
            email,
            phone,
            gender,
            password_hash: encryptedPassword,
            isActive,
        }).returning({
            id: usersTable.id,
            firstName: usersTable.firstName,
            lastName: usersTable.lastName,
            email: usersTable.email
        });

        if (!newUser) {
            return res.status(404).json({ message: "Failed to register the user" });
        }

        // STEP 10: ASSIGN ROLE TO USER (CRITICAL!)
        // Link the user to their role in userRoleTable
        // This is what gives them permissions!
        const [userRoleAssignment] = await db.insert(userRoleTable).values({
            userId: newUser.id,         // The user we just created
            roleId: targetRole.id,      // The role they should have (TEACHER, ACCOUNTANT, etc.)
            assignedBy: newUser.id      // Self-assigned during signup
        }).returning();

        // STEP 11: ROLLBACK IF ROLE ASSIGNMENT FAILS
        // If role assignment fails, delete the user to maintain data integrity
        if (!userRoleAssignment) {
            // Rollback: Delete the user if role assignment fails
            await db.delete(usersTable).where(eq(usersTable.id, newUser.id));
            return res
                .status(500)
                .json({ status: 500, message: "Failed to assign role to user" });
        }

        // STEP 12: RETURN SUCCESS RESPONSE
        // User created and role assigned successfully!
        return res.status(201).json({
            success: true,
            message: `User created successfully with ${roleName} role`,
            data: {
                user: newUser,
                role: targetRole.name,
            },
        });

    } catch (error) {
        console.error("Error creating the user : ", error);
        return res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
}

const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if ([email, password].some((field => field.trim() === "" || !field))) {
            return res.status(400).json({ message: "Email and Password are required fields", status: 400 })
        }

        const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

        if (!user) {
            return res.status(404).json({ message: "User with this email not found in the database", status: 404 })
        }

        const isPasswordValid = bcrypt.compareSync(password, user?.password_hash);

        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid Credentials", status: 400 })
        }

        // Fetch users role and permissions
        const userRolesWithPermissions = await db.select({
            roleId: rolesTable.id,
            roleName: rolesTable.name,
            permissionSlug: permissionsTable.slug,
            permissionModule: permissionsTable.module
        }).from(userRoleTable)
            .innerJoin(rolesTable, eq(userRoleTable.roleId, rolesTable.id))
            .innerJoin(rolePermissionTable, eq(rolesTable.id, rolePermissionTable.roleId))
            .innerJoin(permissionsTable, eq(rolePermissionTable.permissionId, permissionsTable.id))
            .where(eq(userRoleTable.userId, user.id));

        // Extract unique permissions (since a user might have multiple roles with overlapping permissions)
        const permissions = [...new Set(userRolesWithPermissions.map(item => item.permissionSlug))];

        // Extract unique roles
        const roles = [...new Set(userRolesWithPermissions.map(item => item.roleName))];

        // Create accessToken and refreshToken
        const payload: TokenUser = {
            id: user?.id,
            firstName: user?.firstName,
            lastName: user?.lastName,
            email: user?.email,
            gender: user?.gender,
            instituteId: user?.instituteId,
            phone: user?.phone,
            profileImage: user?.profileImage || "",
            permissions: permissions,
            roles: roles
        }

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false, // TODO: Set to true for the hosted production next js frontend app
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Adding the accessToken to the userDetails which will further help the middleware
        const userDetails = { ...user, accessToken, roles, permissions };

        return res.status(200).json({ message: "Logged In", user: userDetails });

    } catch (error) {
        console.error("Error logging In :", error);
        return res.status(500).json({ message: "Internal Server Error", status: 500 })
    }
}

const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email || email.trim() === "") {
            return res.status(400).json({ status: 400, message: "Email is required" });
        }

        const response = await sendEmail(email, "forgotPassword", res);

        if (!response) {
            return res.status(500).json({ status: 500, message: "Failed to send OTP email" });
        }

        return res.status(200).json({ status: 200, message: "OTP sent to your email successfully" });
    } catch (error) {
        console.error("Error in forgotPassword controller :", error);
        return res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
}

const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, otp, newPassword } = req.body;

        if ([email, otp, newPassword].some(field => field.trim() === "" || !field)) {
            return res.status(400).json({ status: 400, message: "Please provide email, otp and newPassword" });
        }

        const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

        if (!user) {
            return res.status(404).json({ status: 404, message: "User with this email not found" });
        }

        const [passwordResetRecord] = await db.select().from(resetPasswordTable).where(eq(resetPasswordTable.userId, user?.id));

        if (!passwordResetRecord) {
            return res.status(404).json({ status: 404, message: "No password reset request found for this user" });
        }

        const isOtpValid = bcrypt.compareSync(otp, passwordResetRecord?.otp);

        if (!isOtpValid) {
            return res.status(400).json({ status: 400, message: "Invalid OTP provided" });
        }

        if (passwordResetRecord.expiresAt < new Date()) {
            return res.status(400).json({ status: 400, message: "OTP has expired" });
        }

        const encryptedPassword = bcrypt.hashSync(newPassword, Number(process.env.SALT_ROUNDS)).toString();

        const response = await db.update(usersTable).set({ password_hash: encryptedPassword }).where(eq(usersTable.id, user?.id)).returning();

        if (response.length > 0) {
            await db.delete(resetPasswordTable).where(eq(resetPasswordTable.userId, user?.id));
        } else {
            return res.status(500).json({ status: 500, message: "Failed to reset the password" });
        }

        return res.status(200).json({ status: 200, message: "Password reset successfully" });

    } catch (error) {
        console.error("Error in resetPassword controller :", error);
        return res.status(500).json({ status: 500, message: "Internal Server Error Resetting the password" });
    }
}

export { signupUser, loginUser, forgotPassword, resetPassword }