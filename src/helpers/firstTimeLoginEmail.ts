// utils/emailSender.ts

import nodemailer from "nodemailer";
import { db } from "../db";
import { instituteProfileTable } from "../models";
import { eq } from "drizzle-orm";
import type { TemplateParams } from "../interface";

interface FirstTimeCredentialsEmailParams {
    parentEmail: string;
    studentName: string;
    temporaryPassword: string;
    instituteId: number;
}

export const sendFirstTimeCredentialsEmail = async ({
    parentEmail,
    studentName,
    temporaryPassword,
    instituteId
}: FirstTimeCredentialsEmailParams): Promise<{
    success: boolean;
    message: string;
}> => {
    try {
        // Fetch institute details for branding
        const [institute] = await db
            .select()
            .from(instituteProfileTable)
            .where(eq(instituteProfileTable.id, instituteId));

        if (!institute) {
            throw new Error("Institute not found");
        }

        // Parse contact info (assuming it's stored as JSON)
        const contactInfo = typeof institute.contactInfo === 'string'
            ? JSON.parse(institute.contactInfo)
            : institute.contactInfo || {};

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST!,
            port: parseInt(process.env.MAIL_PORT || "587"),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.MAIL_USER!,
                pass: process.env.MAIL_USER_PASSWORD!,
            },
            tls: {
                rejectUnauthorized: false // Allow self-signed certificates (for development)
            }
        });

        // Email options
        const mailOptions = {
            from: {
                name: `${institute.schoolName} - School ERP`,
                address: process.env.MAIL_USER!
            },
            to: parentEmail,
            subject: `🎉 Admission Approved - Welcome to ${institute.schoolName}!`,
            html: getAdmissionApprovalTemplate({
                studentName,
                temporaryPassword,
                schoolName: institute.schoolName,
                contactEmail: contactInfo.emails.primary || process.env.MAIL_USER,
                contactPhone: contactInfo.main_phone ?? '',
                schoolAddress: institute.address || '',
                loginUrl: process.env.FRONTEND_URL || 'https://layernlooms.com'
            })
        };

        // Send email
        const mailResponse = await transporter.sendMail(mailOptions);

        console.log("Admission approval email sent successfully:", mailResponse.messageId);

        return {
            success: true,
            message: "Credentials email sent successfully"
        };

    } catch (error: any) {
        console.error("❌ Error sending admission approval email:", error);
        return {
            success: false,
            message: error.message || "Failed to send credentials email"
        };
    }
};

// ============================================
// EMAIL TEMPLATE
// ============================================



const getAdmissionApprovalTemplate = ({
    studentName,
    temporaryPassword,
    schoolName,
    contactEmail,
    contactPhone,
    schoolAddress,
    loginUrl
}: TemplateParams): string => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admission Approved - ${schoolName}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            body {
                margin: 0;
                padding: 0;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                background-color: #f5f7fa;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            
            .email-wrapper {
                width: 100%;
                background-color: #f5f7fa;
                padding: 40px 20px;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 50px 40px;
                text-align: center;
                position: relative;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%23ffffff" fill-opacity="0.1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>') no-repeat bottom;
                background-size: cover;
                opacity: 0.3;
            }
            
            .logo {
                max-width: 80px;
                height: auto;
                margin-bottom: 20px;
                border-radius: 8px;
            }
            
            .header-title {
                color: #ffffff;
                font-size: 32px;
                font-weight: 700;
                margin: 0 0 10px 0;
                position: relative;
            }
            
            .header-subtitle {
                color: rgba(255, 255, 255, 0.95);
                font-size: 18px;
                margin: 0;
                font-weight: 500;
                position: relative;
            }
            
            .content {
                padding: 40px;
            }
            
            .greeting {
                color: #1f2937;
                font-size: 16px;
                line-height: 1.6;
                margin: 0 0 20px 0;
            }
            
            .message {
                color: #374151;
                font-size: 16px;
                line-height: 1.7;
                margin: 0 0 30px 0;
            }
            
            .highlight {
                color: #10b981;
                font-weight: 600;
            }
            
            .info-card {
                background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
                border-radius: 10px;
                padding: 25px;
                margin: 30px 0;
                border: 1px solid #e5e7eb;
            }
            
            .info-card-title {
                color: #6b7280;
                font-size: 13px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                margin: 0 0 16px 0;
            }
            
            .info-row {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-top: 1px solid #e5e7eb;
            }
            
            .info-row:first-child {
                border-top: none;
            }
            
            .info-label {
                color: #374151;
                font-size: 15px;
                font-weight: 500;
            }
            
            .info-value {
                color: #1f2937;
                font-size: 15px;
                font-weight: 600;
                text-align: right;
            }
            
            .admission-badge {
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                color: #1e40af;
                padding: 6px 14px;
                border-radius: 6px;
                font-weight: 700;
                font-size: 14px;
                display: inline-block;
            }
            
            .credentials-box {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border-left: 4px solid #f59e0b;
                border-radius: 8px;
                padding: 25px;
                margin: 30px 0;
            }
            
            .credentials-title {
                color: #92400e;
                font-size: 17px;
                font-weight: 700;
                margin: 0 0 18px 0;
                display: flex;
                align-items: center;
            }
            
            .credentials-title::before {
                content: '🔐';
                margin-right: 8px;
                font-size: 20px;
            }
            
            .credential-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
            }
            
            .credential-label {
                color: #78350f;
                font-size: 15px;
                font-weight: 600;
            }
            
            .credential-value {
                background-color: #ffffff;
                padding: 10px 16px;
                border-radius: 6px;
                font-family: 'Courier New', monospace;
                font-size: 15px;
                font-weight: 600;
                color: #1f2937;
                border: 1px solid #d1d5db;
                letter-spacing: 0.5px;
            }
            
            .security-alert {
                background-color: #fef2f2;
                border-left: 4px solid #ef4444;
                border-radius: 8px;
                padding: 18px;
                margin: 25px 0;
            }
            
            .security-alert-content {
                color: #991b1b;
                font-size: 14px;
                line-height: 1.6;
                margin: 0;
                display: flex;
                align-items: flex-start;
            }
            
            .security-alert-content::before {
                content: '⚠️';
                margin-right: 10px;
                font-size: 18px;
                flex-shrink: 0;
            }
            
            .cta-button {
                display: block;
                text-align: center;
                margin: 35px 0;
            }
            
            .cta-link {
                display: inline-block;
                padding: 16px 48px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                transition: transform 0.2s;
            }
            
            .cta-link:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
            }
            
            .next-steps {
                margin: 35px 0;
            }
            
            .next-steps-title {
                color: #1f2937;
                font-size: 17px;
                font-weight: 700;
                margin: 0 0 16px 0;
                display: flex;
                align-items: center;
            }
            
            .next-steps-title::before {
                content: '📋';
                margin-right: 8px;
                font-size: 20px;
            }
            
            .steps-list {
                margin: 0;
                padding-left: 24px;
                color: #4b5563;
                font-size: 15px;
                line-height: 2;
            }
            
            .steps-list li {
                margin-bottom: 8px;
            }
            
            .closing {
                color: #374151;
                font-size: 16px;
                line-height: 1.7;
                margin: 35px 0 0 0;
            }
            
            .signature {
                color: #1f2937;
                font-weight: 600;
                margin-top: 20px;
            }
            
            .footer {
                background-color: #f9fafb;
                padding: 35px 40px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
            }
            
            .school-info {
                margin-bottom: 20px;
            }
            
            .school-name {
                color: #1f2937;
                font-size: 16px;
                font-weight: 700;
                margin: 0 0 12px 0;
            }
            
            .contact-info {
                color: #6b7280;
                font-size: 13px;
                line-height: 1.8;
                margin: 5px 0;
            }
            
            .contact-info a {
                color: #667eea;
                text-decoration: none;
            }
            
            .divider {
                height: 1px;
                background: linear-gradient(to right, transparent, #e5e7eb, transparent);
                margin: 20px 0;
            }
            
            .disclaimer {
                color: #9ca3af;
                font-size: 12px;
                line-height: 1.6;
                margin: 15px 0 0 0;
            }
            
            @media only screen and (max-width: 600px) {
                .email-wrapper {
                    padding: 20px 10px;
                }
                
                .header {
                    padding: 40px 25px;
                }
                
                .header-title {
                    font-size: 26px;
                }
                
                .header-subtitle {
                    font-size: 16px;
                }
                
                .content {
                    padding: 30px 25px;
                }
                
                .info-row {
                    flex-direction: column;
                    gap: 8px;
                }
                
                .info-value {
                    text-align: left;
                }
                
                .credential-row {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 10px;
                }
                
                .cta-link {
                    padding: 14px 36px;
                    font-size: 15px;
                }
                
                .footer {
                    padding: 30px 25px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="email-container">
                
                <!-- Main Content -->
                <div class="content">
                    <p class="greeting">Dear Parent/Guardian,</p>
                    
                    <p class="message">
                        We are absolutely delighted to inform you that <strong>${studentName}</strong>'s admission to 
                        <strong>${schoolName}</strong> has been <span class="highlight">successfully approved</span>! 🎊
                    </p>

                    <!-- Student Details Card -->
                    <div class="info-card">
                        <p class="info-card-title">📚 Student Details</p>
                        <div class="info-row">
                            <span class="info-label">Student Name</span>
                            <span class="info-value">${studentName}</span>
                        </div>
                    </div>

                    <!-- Login Credentials -->
                    <div class="credentials-box">
                        <p class="credentials-title">Your Login Credentials</p>
                        <div class="credential-row">
                            <span class="credential-label">Temporary Password:</span>
                            <code class="credential-value">${temporaryPassword}</code>
                        </div>
                    </div>

                    <!-- Security Notice -->
                    <div class="security-alert">
                        <p class="security-alert-content">
                            <strong>Important Security Notice:</strong> This is a temporary password. You must change it immediately after your first login for security purposes. Please do not share your credentials with anyone.
                        </p>
                    </div>

                    <!-- Call to Action Button -->
                    <div class="cta-button">
                        <a href="${loginUrl}/login" class="cta-link">
                            Login to Student Portal →
                        </a>
                    </div>

                    <!-- Next Steps -->
                    <div class="next-steps">
                        <p class="next-steps-title">Next Steps</p>
                        <ol class="steps-list">
                            <li>Click the button above to access the student portal</li>
                            <li>Login using the credentials provided in this email</li>
                            <li><strong>Change your password immediately</strong> after first login</li>
                            <li>Complete your student profile with remaining details</li>
                            <li>Upload all required documents (Aadhar, Birth Certificate, etc.)</li>
                            <li>Complete the fee payment process as per schedule</li>
                        </ol>
                    </div>

                    <!-- Closing -->
                    <p class="closing">
                        We are thrilled to welcome <strong>${studentName}</strong> to our school community and look forward to being part of their educational journey!
                    </p>
                    
                    <p class="signature">
                        Warm regards,<br>
                        <strong>${schoolName}</strong><br>
                        Admissions Department
                    </p>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <div class="school-info">
                        <p class="school-name">${schoolName}</p>
                        ${schoolAddress ? `<p class="contact-info">📍 ${schoolAddress}</p>` : ''}
                        ${contactEmail ? `<p class="contact-info">📧 <a href="mailto:${contactEmail}">${contactEmail}</a></p>` : ''}
                        ${contactPhone ? `<p class="contact-info">📞 ${contactPhone}</p>` : ''}
                    </div>
                    
                    <div class="divider"></div>
                    
                    <p class="disclaimer">
                        This is an automated email from the School ERP System. Please do not reply to this email. 
                        For any queries, please contact us using the information provided above.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};