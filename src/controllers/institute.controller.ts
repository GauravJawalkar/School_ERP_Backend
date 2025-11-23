import type { Request, Response } from "express"
import { ApiError } from "../utils/ApiError";
import { db } from "../db";
import { instituteProfileTable } from "../models";
import { eq } from "drizzle-orm";
import { uploadImageToCloudinary } from "../helpers/uploadToCloudinary";

const createInstitute = async (req: Request, res: Response) => {
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

export { createInstitute }