import { eq } from "drizzle-orm";
import { db } from "../db";
import { resetPasswordTable, usersTable } from "../models";
import type { Response } from "express";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";


export const sendEmail = async (email: string, emailType: string, res: Response) => {
    try {
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

        if (!user) {
            console.error("No User found with this email to send OTP")
            return res.status(404).json({
                status: 404, message: "No User found with this email to send OTP"
            });
        }

        const encryptedOtp = bcrypt.hashSync(otp, 10).toString();

        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST!,
            secure: false,
            auth: {
                user: process.env.MAIL_USER!,
                pass: process.env.MAIL_USER_PASSWORD!,
            }
        });

        const mailOptions = {
            from: process.env.MAIL_USER!,
            to: email,
            subject: emailType === "VERIFY_EMAIL" ? "Verify your email" : "Reset your password",
            html: `<p>Your OTP code is ${otp}. It will expire in 5 minutes.</p>`
        };

        const mailResponse = await transporter.sendMail(mailOptions);

        if (!mailResponse) {
            return res.status(500).json({ status: 500, message: "Failed to send email" });
        }

        if (emailType === "forgotPassword") {
            await db.insert(resetPasswordTable).values({
                userId: user?.id,
                otp: encryptedOtp,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
            })
        }

        return mailResponse;

    } catch (error) {
        console.error("Error sending the mail : ", error);
        throw new Error("Error validating with the mail");
    }
}