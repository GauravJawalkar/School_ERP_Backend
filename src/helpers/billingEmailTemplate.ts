import nodemailer from "nodemailer";

interface PlatformBankDetails {
    bankName: string;
    accHolderName: string;
    accNo: string;
    ifsc: string;
    upiId?: string;
}

interface BillingAlertTemplateParams {
    invoiceId: string;
    schoolName: string;
    amount: number;
    dueDate: string;
    paymentGateway: string;
    loginUrl: string;
    platformBankDetails: PlatformBankDetails;
}

export const getBillingAlertTemplate = ({
    invoiceId,
    schoolName,
    amount,
    dueDate,
    paymentGateway,
    loginUrl,
    platformBankDetails
}: BillingAlertTemplateParams): string => {
    const isOnlineGateway = ["STRIPE", "RAZORPAY"].includes(paymentGateway.toUpperCase());
    const formattedAmount = amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SaaS Billing Statement - ${invoiceId}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            body {
                margin: 0;
                padding: 0;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                background-color: #f8fafc;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            
            .email-wrapper {
                width: 100%;
                background-color: #f8fafc;
                padding: 40px 20px;
                box-sizing: border-box;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
                border: 1px solid #f1f5f9;
            }
            
            .header {
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                padding: 48px 40px;
                text-align: center;
                position: relative;
            }
            
            .header-title {
                color: #ffffff;
                font-size: 24px;
                font-weight: 700;
                margin: 0 0 8px 0;
                letter-spacing: -0.025em;
            }
            
            .header-subtitle {
                color: #94a3b8;
                font-size: 14px;
                margin: 0;
                font-weight: 500;
            }
            
            .content {
                padding: 40px;
            }
            
            .greeting {
                color: #0f172a;
                font-size: 16px;
                font-weight: 600;
                margin: 0 0 12px 0;
            }
            
            .message {
                color: #475569;
                font-size: 15px;
                line-height: 1.6;
                margin: 0 0 28px 0;
            }
            
            .summary-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 32px;
                background-color: #f8fafc;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }
            
            .summary-table td {
                padding: 16px 20px;
                border-bottom: 1px solid #e2e8f0;
                font-size: 14px;
                color: #334155;
            }
            
            .summary-table tr:last-child td {
                border-bottom: none;
            }
            
            .summary-label {
                font-weight: 600;
                color: #64748b;
                width: 40%;
            }
            
            .summary-value {
                font-weight: 500;
                color: #0f172a;
                text-align: right;
            }
            
            .summary-value.highlight {
                color: #ef4444;
                font-weight: 700;
                font-size: 16px;
            }
            
            .cta-block {
                text-align: center;
                margin-bottom: 32px;
            }
            
            .btn-primary {
                background-color: #0f172a;
                color: #ffffff !important;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 10px;
                font-weight: 600;
                font-size: 14px;
                display: inline-block;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
                transition: background-color 0.2s;
            }
            
            .bank-transfer-details {
                background-color: #f8fafc;
                padding: 24px;
                border-left: 4px solid #0f172a;
                border-radius: 8px;
                margin-bottom: 32px;
                border-top: 1px solid #e2e8f0;
                border-right: 1px solid #e2e8f0;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .bank-title {
                margin: 0 0 16px 0;
                font-size: 15px;
                font-weight: 700;
                color: #0f172a;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            .bank-row {
                display: flex;
                justify-content: space-between;
                font-size: 13.5px;
                margin-bottom: 8px;
                color: #475569;
            }
            
            .bank-row:last-child {
                margin-bottom: 0;
            }
            
            .bank-label {
                font-weight: 600;
                color: #64748b;
            }
            
            .bank-value {
                font-weight: 500;
                color: #0f172a;
            }
            
            .notice-text {
                font-size: 12px;
                color: #64748b;
                line-height: 1.5;
                font-style: italic;
                margin-top: 12px;
            }
            
            .footer {
                padding: 32px 40px;
                background-color: #f1f5f9;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            
            .footer-text {
                font-size: 12px;
                color: #64748b;
                line-height: 1.6;
                margin: 0;
            }
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="email-container">
                <!-- Header -->
                <div class="header">
                    <h1 class="header-title">Billing Statement</h1>
                    <p class="header-subtitle">Payment Due Alert for ${schoolName}</p>
                </div>
                
                <!-- Content -->
                <div class="content">
                    <p class="greeting">Dear Administrator,</p>
                    <p class="message">
                        This is a friendly notification that a billing statement has been issued for your School ERP services. Please find the statement summary and payment instructions below:
                    </p>
                    
                    <!-- Table -->
                    <table class="summary-table">
                        <tr>
                            <td class="summary-label">Statement ID</td>
                            <td class="summary-value">${invoiceId}</td>
                        </tr>
                        <tr>
                            <td class="summary-label">Due Date</td>
                            <td class="summary-value">${dueDate}</td>
                        </tr>
                        <tr>
                            <td class="summary-label">Payment Method</td>
                            <td class="summary-value">${paymentGateway}</td>
                        </tr>
                        <tr>
                            <td class="summary-label">Total Amount Due</td>
                            <td class="summary-value highlight">₹${formattedAmount}</td>
                        </tr>
                    </table>
                    
                    <!-- Instructions -->
                    ${isOnlineGateway ? `
                        <div class="cta-block">
                            <a href="${loginUrl}/login" class="btn-primary" target="_blank">Log In & Pay Online</a>
                        </div>
                    ` : `
                        <div class="bank-transfer-details">
                            <h4 class="bank-title">Platform Direct Settlement Accounts</h4>
                            <div class="bank-row">
                                <span class="bank-label">Bank Name:</span>
                                <span class="bank-value">${platformBankDetails.bankName}</span>
                            </div>
                            <div class="bank-row">
                                <span class="bank-label">Account Holder:</span>
                                <span class="bank-value">${platformBankDetails.accHolderName}</span>
                            </div>
                            <div class="bank-row">
                                <span class="bank-label">Account Number:</span>
                                <span class="bank-value">${platformBankDetails.accNo}</span>
                            </div>
                            <div class="bank-row">
                                <span class="bank-label">IFSC Code:</span>
                                <span class="bank-value">${platformBankDetails.ifsc}</span>
                            </div>
                            ${platformBankDetails.upiId ? `
                            <div class="bank-row">
                                <span class="bank-label">UPI ID:</span>
                                <span class="bank-value">${platformBankDetails.upiId}</span>
                            </div>
                            ` : ''}
                            <p class="notice-text">
                                * After completing the transfer, please reply to this email with your payment reference or receipt so we can reconcile and clear your balance.
                            </p>
                        </div>
                    `}
                    
                    <p class="message" style="margin-bottom: 0;">
                        To avoid potential billing lockouts or service interruptions, we ask that you complete this payment before the due date. Thank you for your partnership!
                    </p>
                </div>
                
                <!-- Footer -->
                <div class="footer">
                    <p class="footer-text">
                        This is an automated system notification. If you have already completed this payment, please disregard this email.
                    </p>
                    <p class="footer-text" style="margin-top: 8px; font-weight: 500;">
                        © ${new Date().getFullYear()} LayerN Looms. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};
