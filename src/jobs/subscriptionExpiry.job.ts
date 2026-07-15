import cron from "node-cron";
import { db } from "../db";
import { instituteSubscriptionsTable } from "../models";
import { and, lt, eq } from "drizzle-orm";

const checkExpiries = async () => {
    const now = new Date();
    try {
        // 1. Process active subscriptions that expired (cancelAtPeriodEnd = false)
        const expiredResult = await db.update(instituteSubscriptionsTable)
            .set({
                status: "EXPIRED",
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(instituteSubscriptionsTable.status, "ACTIVE"),
                    eq(instituteSubscriptionsTable.cancelAtPeriodEnd, false),
                    lt(instituteSubscriptionsTable.endDate, now)
                )
            )
            .returning({ id: instituteSubscriptionsTable.id, instituteId: instituteSubscriptionsTable.instituteId });

        if (expiredResult.length > 0) {
            console.log(`[Expiry Job] Expired ${expiredResult.length} subscription(s).`);
        }

        // 2. Process active subscriptions that reached end of canceled period (cancelAtPeriodEnd = true)
        const canceledResult = await db.update(instituteSubscriptionsTable)
            .set({
                status: "CANCELED",
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(instituteSubscriptionsTable.status, "ACTIVE"),
                    eq(instituteSubscriptionsTable.cancelAtPeriodEnd, true),
                    lt(instituteSubscriptionsTable.endDate, now)
                )
            )
            .returning({ id: instituteSubscriptionsTable.id, instituteId: instituteSubscriptionsTable.instituteId });

        if (canceledResult.length > 0) {
            console.log(`[Expiry Job] Transitioned ${canceledResult.length} canceled subscription(s) to CANCELED status.`);
        }

        // 3. Process trialing subscriptions that expired (status = 'TRIALING' and trialEndDate < now)
        const expiredTrialsResult = await db.update(instituteSubscriptionsTable)
            .set({
                status: "EXPIRED",
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(instituteSubscriptionsTable.status, "TRIALING"),
                    lt(instituteSubscriptionsTable.trialEndDate, now)
                )
            )
            .returning({ id: instituteSubscriptionsTable.id, instituteId: instituteSubscriptionsTable.instituteId });

        if (expiredTrialsResult.length > 0) {
            console.log(`[Expiry Job] Expired ${expiredTrialsResult.length} trial subscription(s).`);
        }
    } catch (error) {
        console.error("❌ Error running subscription expiry check:", error);
    }
};

export const startSubscriptionExpiryJob = () => {
    console.log("⏱️ Initializing subscription expiry cron job (daily)...");
    
    // Run an initial check on startup
    checkExpiries().then(() => {
        console.log("✅ Initial subscription expiry check completed.");
    });

    // Schedule to run daily at midnight
    cron.schedule("0 0 * * *", async () => {
        console.log("⏱️ Running scheduled subscription expiry check...");
        await checkExpiries();
        console.log("✅ Scheduled subscription expiry check completed.");
    });
};
