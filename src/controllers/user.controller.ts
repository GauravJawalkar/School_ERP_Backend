import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { db } from "../db";
import { rolesTable, userRoleTable, usersTable } from "../models";
import { eq } from "drizzle-orm";
import { uploadImageToCloudinary } from "../helpers/uploadToCloudinary";
import bcrypt from 'bcrypt'

const signupUser = async (req: Request, res: Response) => {
    try {

        // STEP 1: EXTRACT DATA FROM REQUEST
        const { firstName, lastName, instituteId, email, phone, gender, password, isActive, roleName } = req.body;

        // STEP 2: VALIDATE REQUIRED FIELDS
        if ([firstName, lastName, email, phone, gender, password, roleName].some(field => field.trim() === "" || !field)) {
            return res.status(400).json(new ApiError(400, "Provide all required fields"));
        }

        // Check if instituteId is provided
        if (!instituteId) {
            return res.status(400).json(new ApiError(400, "Institute Id is required"));
        }

        // STEP 3: CHECK IF USER ALREADY EXISTS
        // Query database to see if email is already registered
        const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));

        if (existingUser) {
            return res.status(409).json({ message: "User with this email already exists!", status: 409 });
        }

        // STEP 4: PREVENT SUPER_ADMIN ASSIGNMENT VIA SIGNUP
        if (roleName === "SUPER_ADMIN") {
            return res.status(403).json(new ApiError(403, "You Cannot assign SUPER_ADMIN role"));
        }

        // CHECKING IF ROLE EXISTS IN DB
        // Check if the requested role (e.g., "TEACHER", "SCHOOL_ADMIN") exists
        const [targetRole] = await db.select({ id: rolesTable.id, name: rolesTable.name }).from(rolesTable).where(eq(rolesTable.name, roleName)).limit(1);

        if (!targetRole) {
            return res.status(404).json(new ApiError(404, `Role '${roleName}' not found in the database.`));
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
                .json(new ApiError(500, "Failed to assign role to user"));
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
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
}

export { signupUser }