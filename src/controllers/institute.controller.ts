import type { Request, Response } from "express"
import { ApiError } from "../utils/ApiError";
import { db } from "../db";
import { instituteProfileTable, rolesTable, userRoleTable, usersTable } from "../models";
import { eq } from "drizzle-orm";
import { uploadImageToCloudinary } from "../helpers/uploadToCloudinary";
import bcrypt from "bcrypt";
import type { TokenUser } from "../interface";

const createSchool = async (req: Request, res: Response) => {
    try {
        const { schoolName, affiliationNumber, address, main_phone, primaryEmail, office_hours_Mon_Fri, office_hours_Sat, office_hours_Sun, website, landmark, area, city, state, pincode, } = req.body;

        if ([schoolName, affiliationNumber, address, main_phone, primaryEmail, office_hours_Mon_Fri, office_hours_Sat, office_hours_Sun, website, landmark, area, city, state, pincode].some(field => field.trim() === "" || !field)) {
            return res.json(new ApiError(400, "Missing required fields")).status(400);
        }

        const contactInformation = {
            main_phone,
            emails: {
                primary: primaryEmail
            },
            office_hours: {
                monday_to_friday: office_hours_Mon_Fri,
                saturday: office_hours_Sat,
                sunday: office_hours_Sun
            },
            website,
            address_details: {
                landmark,
                area,
                city,
                state,
                pincode
            }
        }

        // Logic to create institute profile goes here
        const [existingInstitute] = await db.select().from(instituteProfileTable).where(eq(instituteProfileTable.schoolName, schoolName));

        if (existingInstitute) {
            return res.json(new ApiError(409, "This school already exists!")).status(409);
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const logoImageLocalPath = files?.instituteLogo?.[0]?.path;

        if (!logoImageLocalPath) {
            return res.json(new ApiError(400, "Logo-image file is missing")).status(400)
        }

        const logoImage = await uploadImageToCloudinary(logoImageLocalPath, "School_Erp_Logos");

        if (!logoImage) {
            return res.json(new ApiError(500, "Failed to upload logo image")).status(500);
        }

        const [newInstitute] = await db.insert(instituteProfileTable).values({
            schoolName,
            affiliationNumber,
            address,
            logoUrl: logoImage?.secure_url,
            contactInfo: contactInformation
        }).returning();

        // Check if institute creation was successful
        if (!newInstitute) {
            return res.json(new ApiError(404, "Failed to register the institute")).status(404);
        }

        return res.status(201).json({ message: "Institute created Successfully", data: newInstitute });

    } catch (error) {
        console.error("Errro Creating institute : ", error);
        return res.json(new ApiError(500, "Internal Server Error")).status(500);
    }
}

const createSchoolAdmin = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, instituteId, email, phone, gender, password, isActive, roleName } = req.body;

        if ([firstName, lastName, email, phone, gender, password, roleName].some(field => field.trim() === "" || !field)) {
            return res.status(400).json({ status: 400, message: "Provide all required fields" });
        }

        if (!instituteId) {
            return res.status(400).json(new ApiError(400, "Institute Id is required"));
        }

        const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));

        if (existingUser) {
            return res.status(409).json({ message: "User with this email already exists!", status: 409 });
        }

        if (roleName === "SUPER_ADMIN") {
            return res.status(403).json({ status: 403, message: "You Cannot assign SUPER_ADMIN role" });
        }

        const [targetRole] = await db.select({ id: rolesTable.id, name: rolesTable.name }).from(rolesTable).where(eq(rolesTable.name, roleName)).limit(1);

        if (!targetRole) {
            return res.status(404).json({ status: 404, message: `Role '${roleName}' not found in the database.` });
        }

        const encryptedPassword = bcrypt.hashSync(password, Number(process.env.SALT_ROUNDS)).toString();

        const [schoolAdmin] = await db.insert(usersTable).values({
            firstName,
            lastName,
            instituteId,
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

        if (!schoolAdmin) {
            return res.status(404).json({ message: "Failed to register the admin" });
        }

        // Safely resolve assignedBy from req.user which can be string | JwtPayload
        const assignedBy = (req.user && typeof req.user !== "string" && "id" in req.user) ? (req.user as TokenUser).id : undefined;

        const [userRoleAssignment] = await db.insert(userRoleTable).values({
            userId: schoolAdmin.id,         // The user we just created
            roleId: targetRole.id,      // The role they should have (TEACHER, ACCOUNTANT, etc.)
            assignedBy: assignedBy      // Assigned by super admin only
        }).returning();

        if (!userRoleAssignment) {
            // Rollback: Delete the user if role assignment fails
            await db.delete(usersTable).where(eq(usersTable.id, schoolAdmin.id));
            return res
                .status(500)
                .json(new ApiError(500, "Failed to assign role to user"));
        }

        return res.status(201).json({
            success: true,
            message: `School Admin created successfully with ${roleName} role`,
            data: {
                user: schoolAdmin,
                role: targetRole.name,
                schoolId: instituteId
            },
        });

    } catch (error) {
        console.error("Error Creating School Admin : ", error);
        return res.status(500).json({ status: 500, message: "Internal Server Error Creating School Admin" })
    }
}

export { createSchool, createSchoolAdmin }