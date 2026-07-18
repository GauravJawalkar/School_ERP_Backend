import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import {
    instituteSubscriptionsTable,
    subscriptionPlansTable,
    studentsTable,
    staffTable
} from "../models";
import { eq, and, sql, inArray } from "drizzle-orm";
import { superAdmin } from "../constants/auth.constants";
import { SUBSCRIPTION_MODULES } from "../constants/subscriptionModules.constants";
import type { TokenUser } from "../interface";

export const checkSubscriptionLimits = (options: { limitType?: 'student' | 'staff'; module?: string }) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 1. Authenticated user check
            if (!req.user || typeof req.user === "string") {
                return res.status(401).json({
                    status: 401,
                    success: false,
                    message: "Authentication required"
                });
            }

            const user = req.user as TokenUser;

            // 2. Bypass entirely for Super Admin
            if (user.roles?.includes(superAdmin)) {
                return next();
            }

            const instituteId = Number(user.instituteId);
            if (!instituteId) {
                return res.status(400).json({
                    status: 400,
                    success: false,
                    message: "Institute context missing"
                });
            }

            // 3. Validate module parameter if provided
            if (options.module) {
                if (!SUBSCRIPTION_MODULES.includes(options.module as any)) {
                    return res.status(500).json({
                        status: 500,
                        success: false,
                        message: `Internal Configuration Error: Invalid module name '${options.module}' passed to subscription guard.`
                    });
                }
            }

            // 4. Fetch the active subscription
            const [subscription] = await db
                .select({
                    status: instituteSubscriptionsTable.status,
                    endDate: instituteSubscriptionsTable.endDate,
                    maxStudents: subscriptionPlansTable.maxStudents,
                    maxStaff: subscriptionPlansTable.maxStaff,
                    features: subscriptionPlansTable.features
                })
                .from(instituteSubscriptionsTable)
                .innerJoin(subscriptionPlansTable, eq(instituteSubscriptionsTable.planId, subscriptionPlansTable.id))
                .where(
                    and(
                        eq(instituteSubscriptionsTable.instituteId, instituteId),
                        inArray(instituteSubscriptionsTable.status, ["ACTIVE", "TRIALING", "PAST_DUE"])
                    )
                )
                .limit(1);

            if (!subscription) {
                return res.status(403).json({
                    status: 403,
                    success: false,
                    message: "No active subscription found for this school. Access restricted."
                });
            }

            // Check if subscription has expired
            if (new Date() > new Date(subscription.endDate)) {
                return res.status(403).json({
                    status: 403,
                    success: false,
                    message: "Subscription has expired. Please contact administration."
                });
            }

            // 5. Check Module Permission
            if (options.module) {
                const features = subscription.features as { modules?: string[] } | null;
                if (!features?.modules || !features.modules.includes(options.module)) {
                    return res.status(403).json({
                        status: 403,
                        success: false,
                        message: `The ${options.module} module is not available in your current subscription plan.`
                    });
                }
            }

            // 6. Check Student limit
            if (options.limitType === 'student') {
                const studentsCountQuery = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(studentsTable)
                    .where(eq(studentsTable.instituteId, instituteId));

                const currentCount = Number(studentsCountQuery[0]?.count || 0);
                if (subscription.maxStudents !== -1 && currentCount >= subscription.maxStudents) {
                    return res.status(403).json({
                        status: 403,
                        success: false,
                        message: `Maximum student limit (${subscription.maxStudents}) reached for this plan.`
                    });
                }
            }

            // 7. Check Staff limit
            if (options.limitType === 'staff') {
                const staffCountQuery = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(staffTable)
                    .where(eq(staffTable.instituteId, instituteId));

                const currentCount = Number(staffCountQuery[0]?.count || 0);
                if (subscription.maxStaff !== -1 && currentCount >= subscription.maxStaff) {
                    return res.status(403).json({
                        status: 403,
                        success: false,
                        message: `Maximum staff limit (${subscription.maxStaff}) reached for this plan.`
                    });
                }
            }

            next();
        } catch (error: any) {
            console.error("Subscription guard error:", error);
            res.status(500).json({
                status: 500,
                success: false,
                message: "Internal Server Error during subscription verification",
                error: error.message
            });
        }
    };
};
