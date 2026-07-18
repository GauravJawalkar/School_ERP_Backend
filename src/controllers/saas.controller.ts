import type { Request, Response } from "express";
import { db } from "../db";
import {
    subscriptionPlansTable,
    subscriptionPricesTable,
    instituteSubscriptionsTable,
    subscriptionPaymentsTable,
    instituteProfileTable
} from "../models";
import { eq, and, desc, asc, or } from "drizzle-orm";
import { SUBSCRIPTION_MODULES } from "../constants/subscriptionModules.constants";
import crypto from "crypto";
import nodemailer from "nodemailer";
import type { ContactInfo } from "../interface";
import { getBillingAlertTemplate } from "../helpers/billingEmailTemplate";

// Helper to validate modules
const validateModules = (modules: any): boolean => {
    if (!Array.isArray(modules)) return false;
    return modules.every(mod => SUBSCRIPTION_MODULES.includes(mod as any));
};

// 1. Create a Subscription Plan
export const createPlan = async (req: Request, res: Response) => {
    try {
        const { name, slug, description, maxStudents, maxStaff, features, isActive } = req.body;

        if (!name || !slug || !features) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Missing required fields (name, slug, features)"
            });
        }

        // Validate features.modules
        if (!features.modules || !validateModules(features.modules)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Invalid module names in features.modules"
            });
        }

        const [existingPlan] = await db
            .select()
            .from(subscriptionPlansTable)
            .where(eq(subscriptionPlansTable.slug, slug))
            .limit(1);

        if (existingPlan) {
            return res.status(409).json({
                status: 409,
                success: false,
                message: "Plan with this slug already exists"
            });
        }

        const [newPlan] = await db.insert(subscriptionPlansTable).values({
            name,
            slug,
            description,
            maxStudents: maxStudents !== undefined ? Number(maxStudents) : -1,
            maxStaff: maxStaff !== undefined ? Number(maxStaff) : -1,
            features,
            isActive: isActive !== undefined ? Boolean(isActive) : true
        }).returning();

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Plan created successfully",
            data: newPlan
        });
    } catch (error: any) {
        console.error("Error creating plan:", error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// 2. Update an existing Plan
export const updatePlan = async (req: Request, res: Response) => {
    try {
        const planId = Number(req.params.id);
        const { name, slug, description, maxStudents, maxStaff, features, isActive } = req.body;

        if (isNaN(planId)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Invalid plan ID"
            });
        }

        // Validate features.modules if provided
        if (features && (!features.modules || !validateModules(features.modules))) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Invalid module names in features.modules"
            });
        }

        const [existingPlan] = await db
            .select()
            .from(subscriptionPlansTable)
            .where(eq(subscriptionPlansTable.id, planId))
            .limit(1);

        if (!existingPlan) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Plan not found"
            });
        }

        const [updatedPlan] = await db
            .update(subscriptionPlansTable)
            .set({
                name,
                slug,
                description,
                maxStudents: maxStudents !== undefined ? Number(maxStudents) : undefined,
                maxStaff: maxStaff !== undefined ? Number(maxStaff) : undefined,
                features,
                isActive: isActive !== undefined ? Boolean(isActive) : undefined,
                updatedAt: new Date()
            })
            .where(eq(subscriptionPlansTable.id, planId))
            .returning();

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Plan updated successfully",
            data: updatedPlan
        });
    } catch (error: any) {
        console.error("Error updating plan:", error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// 3. Create a Plan Price
export const createPrice = async (req: Request, res: Response) => {
    try {
        const { planId, billingPeriod, amount, currency, isActive } = req.body;

        if (!planId || !billingPeriod || !amount) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Missing required fields (planId, billingPeriod, amount)"
            });
        }

        const [plan] = await db
            .select()
            .from(subscriptionPlansTable)
            .where(eq(subscriptionPlansTable.id, Number(planId)))
            .limit(1);

        if (!plan) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Target plan not found"
            });
        }

        const [newPrice] = await db.insert(subscriptionPricesTable).values({
            planId: Number(planId),
            billingPeriod,
            amount: amount.toString(),
            currency: currency || "INR",
            isActive: isActive !== undefined ? Boolean(isActive) : true
        }).returning();

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Price added successfully",
            data: newPrice
        });
    } catch (error: any) {
        console.error("Error creating price:", error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// 4. Assign or Upgrade Subscription
export const assignSubscription = async (req: Request, res: Response) => {
    try {
        const { instituteId, planId, priceId, billingPeriod, paymentGateway, gatewayTransactionId, amount, currency } = req.body;

        if (!instituteId || !planId || !priceId || !billingPeriod) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Missing required fields (instituteId, planId, priceId, billingPeriod)"
            });
        }

        // Validate target institute
        const [inst] = await db
            .select()
            .from(instituteProfileTable)
            .where(eq(instituteProfileTable.id, Number(instituteId)))
            .limit(1);

        if (!inst) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Institute not found"
            });
        }

        // Validate plan
        const [plan] = await db
            .select()
            .from(subscriptionPlansTable)
            .where(eq(subscriptionPlansTable.id, Number(planId)))
            .limit(1);

        if (!plan) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Plan not found"
            });
        }

        // Validate price belongs to the plan
        const [price] = await db
            .select()
            .from(subscriptionPricesTable)
            .where(
                and(
                    eq(subscriptionPricesTable.id, Number(priceId)),
                    eq(subscriptionPricesTable.planId, Number(planId))
                )
            )
            .limit(1);

        if (!price) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Invalid price: the price record does not exist or does not belong to the selected plan"
            });
        }

        // Calculate end date using calendar-month date math
        const endDate = new Date();
        if (billingPeriod === "MONTHLY") {
            endDate.setMonth(endDate.getMonth() + 1);
        } else if (billingPeriod === "HALF_YEARLY") {
            endDate.setMonth(endDate.getMonth() + 6);
        } else if (billingPeriod === "ANNUALLY") {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Invalid billing period"
            });
        }

        let assignedSubscription;

        // Perform in a single transaction
        await db.transaction(async (tx) => {
            // Supersede existing ACTIVE subscription
            await tx
                .update(instituteSubscriptionsTable)
                .set({ status: "CANCELED" })
                .where(
                    and(
                        eq(instituteSubscriptionsTable.instituteId, Number(instituteId)),
                        eq(instituteSubscriptionsTable.status, "ACTIVE")
                    )
                );

            const [newSub] = await tx.insert(instituteSubscriptionsTable).values({
                instituteId: Number(instituteId),
                planId: Number(planId),
                priceId: Number(priceId),
                status: "ACTIVE",
                startDate: new Date(),
                endDate: endDate,
                cancelAtPeriodEnd: false
            }).returning();

            if (!newSub) {
                throw new Error("Failed to insert institute subscription record");
            }

            assignedSubscription = newSub;

            // Log payment record
            await tx.insert(subscriptionPaymentsTable).values({
                instituteSubscriptionId: newSub.id,
                instituteId: Number(instituteId),
                amount: amount ? amount.toString() : "0.00",
                currency: currency || "INR",
                paymentGateway: paymentGateway || "MANUAL",
                gatewayTransactionId: gatewayTransactionId || `MANUAL-${crypto.randomUUID()}`,
                status: "SUCCESS",
                paidAt: new Date()
            });
        });

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Subscription assigned successfully",
            data: assignedSubscription
        });
    } catch (error: any) {
        console.error("Error assigning subscription:", error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// 5. Get Institute Subscription Status
export const getInstituteSubscriptionStatus = async (req: Request, res: Response) => {
    try {
        const instituteId = Number(req.params.instituteId);

        if (isNaN(instituteId)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Invalid institute ID"
            });
        }

        // Fetch active/latest subscription
        const subs = await db
            .select({
                subscription: instituteSubscriptionsTable,
                plan: subscriptionPlansTable
            })
            .from(instituteSubscriptionsTable)
            .innerJoin(subscriptionPlansTable, eq(instituteSubscriptionsTable.planId, subscriptionPlansTable.id))
            .where(eq(instituteSubscriptionsTable.instituteId, instituteId))
            .orderBy(desc(instituteSubscriptionsTable.createdAt));

        const latest = subs[0];
        if (!latest) {
            return res.status(200).json({
                status: 200,
                success: true,
                message: "No subscription history found for this institute",
                data: null
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Fetched subscription details successfully",
            data: {
                activeSubscription: subs.find(s => s.subscription.status === "ACTIVE")?.subscription || null,
                latestSubscription: latest.subscription,
                planDetails: latest.plan,
                history: subs.map(s => s.subscription)
            }
        });
    } catch (error: any) {
        console.error("Error fetching subscription status:", error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// 6. Get All Subscriptions
export const getAllSubscriptions = async (req: Request, res: Response) => {
    try {
        const subs = await db
            .select({
                contractId: instituteSubscriptionsTable.id,
                instituteId: instituteSubscriptionsTable.instituteId,
                schoolName: instituteProfileTable.schoolName,
                schoolSlug: instituteProfileTable.slug,
                tierName: subscriptionPlansTable.name,
                billingCycle: subscriptionPricesTable.billingPeriod,
                price: subscriptionPricesTable.amount,
                billingStatus: instituteSubscriptionsTable.status,
                startDate: instituteSubscriptionsTable.startDate,
                renewalDate: instituteSubscriptionsTable.endDate,
            })
            .from(instituteSubscriptionsTable)
            .innerJoin(subscriptionPlansTable, eq(instituteSubscriptionsTable.planId, subscriptionPlansTable.id))
            .innerJoin(instituteProfileTable, eq(instituteSubscriptionsTable.instituteId, instituteProfileTable.id))
            .innerJoin(subscriptionPricesTable, eq(instituteSubscriptionsTable.priceId, subscriptionPricesTable.id))
            .orderBy(desc(instituteSubscriptionsTable.createdAt));

        const formattedSubs = subs.map(sub => ({
            ...sub,
            contractId: sub.contractId.toString(),
            price: parseFloat(sub.price)
        }));

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Fetched all subscriptions",
            data: formattedSubs
        });
    } catch (error: any) {
        console.error("Error fetching all subscriptions:", error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// 7. Get All Plans with their Prices
export const getPlans = async (req: Request, res: Response) => {
    try {
        const plans = await db
            .select()
            .from(subscriptionPlansTable)
            .orderBy(asc(subscriptionPlansTable.id));

        const prices = await db
            .select()
            .from(subscriptionPricesTable)
            .where(eq(subscriptionPricesTable.isActive, true))
            .orderBy(asc(subscriptionPricesTable.id));

        const plansWithPrices = plans.map(plan => {
            const planPrices = prices.filter(p => p.planId === plan.id);
            return {
                ...plan,
                prices: planPrices
            };
        });

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Fetched subscription plans successfully",
            data: plansWithPrices
        });
    } catch (error: any) {
        console.error("Error fetching plans:", error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// 8. Update Plan Price
export const updatePrice = async (req: Request, res: Response) => {
    try {
        const priceId = Number(req.params.id);
        const { amount, isActive } = req.body;

        if (isNaN(priceId)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Invalid price ID"
            });
        }

        const [updatedPrice] = await db
            .update(subscriptionPricesTable)
            .set({
                amount: amount !== undefined ? amount.toString() : undefined,
                isActive: isActive !== undefined ? Boolean(isActive) : undefined,
                updatedAt: new Date()
            })
            .where(eq(subscriptionPricesTable.id, priceId))
            .returning();

        if (!updatedPrice) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Price record not found"
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Price updated successfully",
            data: updatedPrice
        });
    } catch (error: any) {
        console.error("Error updating price:", error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// 9. Delete a Plan
export const deletePlan = async (req: Request, res: Response) => {
    try {
        const planId = Number(req.params.id);

        if (isNaN(planId)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Invalid plan ID"
            });
        }

        // Delete the plan
        const [deleted] = await db
            .delete(subscriptionPlansTable)
            .where(eq(subscriptionPlansTable.id, planId))
            .returning();

        if (!deleted) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Plan not found"
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Plan deleted successfully",
            data: deleted
        });
    } catch (error: any) {
        console.error("Error deleting plan:", error);
        
        // Handle foreign key constraint violation (e.g. 23503 in PG)
        if (error.code === "23503") {
            return res.status(409).json({
                status: 409,
                success: false,
                message: "Cannot delete this plan because active school subscriptions are currently using it. Try marking it as Inactive instead."
            });
        }

        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// 10. Get All Billing Transactions/Payments
export const getAllTransactions = async (req: Request, res: Response) => {
    try {
        const payments = await db
            .select({
                id: subscriptionPaymentsTable.id,
                invoiceId: subscriptionPaymentsTable.invoiceNumber,
                gatewayTxId: subscriptionPaymentsTable.gatewayTransactionId,
                schoolName: instituteProfileTable.schoolName,
                schoolSlug: instituteProfileTable.slug,
                amount: subscriptionPaymentsTable.amount,
                paymentMethod: subscriptionPaymentsTable.paymentGateway,
                status: subscriptionPaymentsTable.status,
                invoiceDate: subscriptionPaymentsTable.createdAt,
                dueDate: subscriptionPaymentsTable.dueDate,
            })
            .from(subscriptionPaymentsTable)
            .innerJoin(instituteProfileTable, eq(subscriptionPaymentsTable.instituteId, instituteProfileTable.id))
            .orderBy(desc(subscriptionPaymentsTable.createdAt));

        const formatted = payments.map(p => {
            // Map SUCCESS -> PAID, PENDING -> PENDING, etc.
            let displayStatus = "UNPAID";
            if (p.status === "SUCCESS") {
                displayStatus = "PAID";
            } else if (p.status === "FAILED") {
                displayStatus = "FAILED";
            } else if (p.status === "PENDING" || p.status === "UNPAID" || p.status === "OVERDUE") {
                displayStatus = "UNPAID";
            } else {
                displayStatus = p.status;
            }

            return {
                invoiceId: p.invoiceId || p.gatewayTxId,
                schoolName: p.schoolName,
                schoolSlug: p.schoolSlug,
                amount: parseFloat(p.amount) || 0,
                paymentMethod: p.paymentMethod,
                status: displayStatus,
                invoiceDate: p.invoiceDate.toISOString().split("T")[0],
                dueDate: p.dueDate 
                    ? p.dueDate.toISOString().split("T")[0] 
                    : new Date(p.invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            };
        });

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Fetched all billing transactions successfully",
            data: formatted
        });
    } catch (error: any) {
        console.error("Error fetching all billing transactions:", error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

export const reconcileTransaction = async (req: Request, res: Response) => {
    try {
        const { invoiceId } = req.params;

        if (!invoiceId) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Missing invoice ID"
            });
        }

        // Wrap updates and validation checks inside a single database transaction block
        const result = await db.transaction(async (tx) => {
            // 1. Fetch payment record inside the transaction
            const [payment] = await tx
                .select()
                .from(subscriptionPaymentsTable)
                .where(eq(subscriptionPaymentsTable.invoiceNumber, invoiceId))
                .limit(1);

            // 2. Null and 404 Guard Check
            if (!payment) {
                return { errorStatus: 404, message: "Invoice statement not found." };
            }

            // 3. Idempotency Check
            if (payment.status === "SUCCESS") {
                return { errorStatus: 400, message: "This statement has already been reconciled & settled." };
            }

            // 4. Update statement status to SUCCESS
            const [upPayment] = await tx
                .update(subscriptionPaymentsTable)
                .set({
                    status: "SUCCESS",
                    paidAt: new Date()
                })
                .where(eq(subscriptionPaymentsTable.invoiceNumber, invoiceId))
                .returning();

            // 5. Restore target subscription status to ACTIVE if it was PAST_DUE
            const [sub] = await tx
                .select()
                .from(instituteSubscriptionsTable)
                .where(eq(instituteSubscriptionsTable.id, payment.instituteSubscriptionId))
                .limit(1);

            if (sub && sub.status === "PAST_DUE") {
                await tx
                    .update(instituteSubscriptionsTable)
                    .set({
                        status: "ACTIVE",
                        updatedAt: new Date()
                    })
                    .where(eq(instituteSubscriptionsTable.id, sub.id));
            }

            return { success: true, data: upPayment };
        });

        // If transaction returned an validation error result, output it directly
        if ("errorStatus" in result && result.errorStatus !== undefined) {
            return res.status(result.errorStatus).json({
                status: result.errorStatus,
                success: false,
                message: result.message
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Statement successfully reconciled & settled",
            data: result.data
        });
    } catch (error: any) {
        console.error("Error reconciling transaction:", error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// 12. Resend Statement Alert (Email Reminder)
export const resendAlert = async (req: Request, res: Response) => {
    try {
        const { invoiceId } = req.body;

        if (!invoiceId) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Missing invoice ID"
            });
        }

        // Fetch payment and join with institute profile
        const [payment] = await db
            .select({
                payment: subscriptionPaymentsTable,
                schoolName: instituteProfileTable.schoolName,
                contactInfo: instituteProfileTable.contactInfo,
            })
            .from(subscriptionPaymentsTable)
            .innerJoin(instituteProfileTable, eq(subscriptionPaymentsTable.instituteId, instituteProfileTable.id))
            .where(eq(subscriptionPaymentsTable.invoiceNumber, invoiceId))
            .limit(1);

        if (!payment) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Invoice statement not found"
            });
        }

        // Retrieve target school email based on hierarchy: emails.accounts -> emails.primary -> fallback env MAIL_USER
        let targetEmail = "";
        if (payment.contactInfo) {
            const info = payment.contactInfo as ContactInfo;
            targetEmail = info.emails?.accounts || info.emails?.primary || "";
        }

        if (!targetEmail) {
            console.log("No email address configured for school:", payment.schoolName);
        } else {
            // Retrieve platform receiving bank details from env
            const platformBankDetails = {
                bankName: process.env.PLATFORM_BANK_NAME || "SaaS Platform Bank",
                accHolderName: process.env.PLATFORM_BANK_ACC_HOLDER || "LayerN Looms SaaS Pvt Ltd",
                accNo: process.env.PLATFORM_BANK_ACC_NO || "1234567890",
                ifsc: process.env.PLATFORM_BANK_IFSC || "IFSC0001234",
                upiId: process.env.PLATFORM_BANK_UPI || "layernlooms@upi"
            };

            // Attempt to send email
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.MAIL_HOST!,
                    port: parseInt(process.env.MAIL_PORT || "587"),
                    secure: false,
                    auth: {
                        user: process.env.MAIL_USER!,
                        pass: process.env.MAIL_USER_PASSWORD!,
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                });

                const isOnlineGateway = ["STRIPE", "RAZORPAY"].includes(payment.payment.paymentGateway.toUpperCase());
                const loginUrl = process.env.FRONTEND_URL || "https://layernlooms.com";

                const mailOptions = {
                    from: {
                        name: "SaaS Billing Hub",
                        address: process.env.MAIL_USER!
                    },
                    to: targetEmail,
                    subject: `⚠️ Payment Due Reminder: Statement ${invoiceId} - ${payment.schoolName}`,
                    html: getBillingAlertTemplate({
                        invoiceId,
                        schoolName: payment.schoolName,
                        amount: parseFloat(payment.payment.amount),
                        dueDate: payment.payment.dueDate ? payment.payment.dueDate.toLocaleDateString("en-IN") : "N/A",
                        paymentGateway: payment.payment.paymentGateway,
                        loginUrl,
                        platformBankDetails
                    })
                };

                await transporter.sendMail(mailOptions);
            } catch (err) {
                console.error("Nodemailer failed to dispatch statement email (likely unconfigured in dev):", err);
            }
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Billing statement reminder successfully dispatched"
        });
    } catch (error: any) {
        console.error("Error sending statement reminder:", error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// 13. Manually Issue a Statement/Invoice
export const issueInvoice = async (req: Request, res: Response) => {
    try {
        const { schoolSlug, amount, paymentMethod, dueDate, invoiceDate, invoiceId } = req.body;

        if (!schoolSlug || amount === undefined) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Missing required fields (schoolSlug, amount)"
            });
        }

        // Find institute by slug
        const [institute] = await db
            .select()
            .from(instituteProfileTable)
            .where(eq(instituteProfileTable.slug, schoolSlug))
            .limit(1);

        if (!institute) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: `School with subdomain lookup slug "${schoolSlug}" was not found.`
            });
        }

        // Strict validation: Reject if no ACTIVE or PAST_DUE subscription exists
        const [activeOrPastDueSub] = await db
            .select()
            .from(instituteSubscriptionsTable)
            .where(
                and(
                    eq(instituteSubscriptionsTable.instituteId, institute.id),
                    or(
                        eq(instituteSubscriptionsTable.status, "ACTIVE"),
                        eq(instituteSubscriptionsTable.status, "PAST_DUE")
                    )
                )
            )
            .limit(1);

        if (!activeOrPastDueSub) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Cannot issue invoice: the institute does not have a current ACTIVE or PAST_DUE subscription."
            });
        }
        const subId = activeOrPastDueSub.id;

        // Auto-generate invoiceId if none is provided
        const finalInvoiceId = invoiceId || `INV-${Date.now().toString().slice(-5)}`;

        // Human-facing Invoice number collision validation (Explicit Pre-Check)
        const [existingInvoice] = await db
            .select()
            .from(subscriptionPaymentsTable)
            .where(eq(subscriptionPaymentsTable.invoiceNumber, finalInvoiceId))
            .limit(1);

        if (existingInvoice) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: `Invoice number "${finalInvoiceId}" already exists. Please choose a unique invoice number.`
            });
        }

        // Insert new payment record
        const [newPayment] = await db
            .insert(subscriptionPaymentsTable)
            .values({
                instituteSubscriptionId: subId,
                instituteId: institute.id,
                amount: amount.toString(),
                currency: "INR",
                paymentGateway: paymentMethod || "MANUAL",
                gatewayTransactionId: `MANUAL-${crypto.randomUUID()}`, // Unique Stripe/Razorpay or manual ref id
                invoiceNumber: finalInvoiceId, // Dedicated human-readable invoice reference
                status: "PENDING", // Initiated manual invoices start as PENDING/UNPAID
                dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Sets due date
                createdAt: invoiceDate ? new Date(invoiceDate) : new Date()
            })
            .returning();

        if (!newPayment) {
            return res.status(500).json({
                status: 500,
                success: false,
                message: "Failed to record manual invoice statement."
            });
        }

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Manual client statement successfully issued",
            data: {
                ...newPayment,
                invoiceId: newPayment.invoiceNumber,
                schoolName: institute.schoolName,
                schoolSlug: institute.slug,
                amount: parseFloat(newPayment.amount),
                status: "UNPAID",
                invoiceDate: newPayment.createdAt.toISOString().split("T")[0],
                dueDate: newPayment.dueDate ? newPayment.dueDate.toISOString().split("T")[0] : null
            }
        });
    } catch (error: any) {
        console.error("Error issuing manual invoice:", error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};


