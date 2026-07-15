import type { Request, Response } from "express";
import { db } from "../db";
import {
    subscriptionPlansTable,
    subscriptionPricesTable,
    instituteSubscriptionsTable,
    subscriptionPaymentsTable,
    instituteProfileTable
} from "../models";
import { eq, and, desc } from "drizzle-orm";
import { SUBSCRIPTION_MODULES } from "../constants/subscriptionModules.constants";
import crypto from "crypto";

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

        // Calculate end date
        const endDate = new Date();
        if (billingPeriod === "MONTHLY") {
            endDate.setDate(endDate.getDate() + 30);
        } else if (billingPeriod === "HALF_YEARLY") {
            endDate.setDate(endDate.getDate() + 180);
        } else if (billingPeriod === "ANNUALLY") {
            endDate.setDate(endDate.getDate() + 365);
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
                subscription: instituteSubscriptionsTable,
                plan: subscriptionPlansTable,
                schoolName: instituteProfileTable.schoolName
            })
            .from(instituteSubscriptionsTable)
            .innerJoin(subscriptionPlansTable, eq(instituteSubscriptionsTable.planId, subscriptionPlansTable.id))
            .innerJoin(instituteProfileTable, eq(instituteSubscriptionsTable.instituteId, instituteProfileTable.id))
            .orderBy(desc(instituteSubscriptionsTable.createdAt));

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Fetched all subscriptions",
            data: subs
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
            .from(subscriptionPlansTable);

        const prices = await db
            .select()
            .from(subscriptionPricesTable)
            .where(eq(subscriptionPricesTable.isActive, true));

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

