import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_SECRET!
})

export const uploadImageToCloudinary = async (localFilePath: string, folder: string) => {
    try {
        if (!localFilePath) return null;
        // Upload to specific folder in Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto", folder });

        console.log("File uploaded on cloudinary : ", response.url);

        // Remove temp file after upload
        fs.unlinkSync(localFilePath);
        return response
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        // Ensure local temp file is cleaned up
        fs.unlinkSync(localFilePath);
        return null
    }
}