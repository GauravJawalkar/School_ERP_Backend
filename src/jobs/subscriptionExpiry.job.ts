import cron from "node-cron";
import { db } from "../db";
import { instituteSubscriptionsTable, subscriptionPaymentsTable } from "../models";
import { and, lt, eq, inArray } from "drizzle-orm";

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

        // 4. Process pending payments that are overdue (marking payment OVERDUE, subscription PAST_DUE)
        const overduePayments = await db.update(subscriptionPaymentsTable)
            .set({ status: "OVERDUE" })
            .where(
                and(
                    eq(subscriptionPaymentsTable.status, "PENDING"),
                    lt(subscriptionPaymentsTable.dueDate, now)
                )
            )
            .returning({
                id: subscriptionPaymentsTable.id,
                instituteSubscriptionId: subscriptionPaymentsTable.instituteSubscriptionId
            });

        if (overduePayments.length > 0) {
            console.log(`[Expiry Job] Marked ${overduePayments.length} payment(s) as OVERDUE.`);

            const subIdsToUpdate = Array.from(new Set(overduePayments.map(p => p.instituteSubscriptionId)));

            if (subIdsToUpdate.length > 0) {
                const updatedSubs = await db.update(instituteSubscriptionsTable)
                    .set({
                        status: "PAST_DUE",
                        updatedAt: new Date()
                    })
                    .where(
                        and(
                            eq(instituteSubscriptionsTable.status, "ACTIVE"),
                            inArray(instituteSubscriptionsTable.id, subIdsToUpdate)
                        )
                    )
                    .returning({ id: instituteSubscriptionsTable.id });
                console.log(`[Expiry Job] Transitioned ${updatedSubs.length} active subscription(s) to PAST_DUE.`);
            }
        }

        // 5. Process PAST_DUE subscriptions whose overdue payment is past the 7-day grace window (escalating to UNPAID)
        const gracePeriodLimit = new Date();
        gracePeriodLimit.setDate(gracePeriodLimit.getDate() - 7); // N = 7 days grace period

        const unpaidPayments = await db
            .select({
                instituteSubscriptionId: subscriptionPaymentsTable.instituteSubscriptionId
            })
            .from(subscriptionPaymentsTable)
            .where(
                and(
                    eq(subscriptionPaymentsTable.status, "OVERDUE"),
                    lt(subscriptionPaymentsTable.dueDate, gracePeriodLimit)
                )
            );

        const subIdsToLockout = Array.from(new Set(unpaidPayments.map(p => p.instituteSubscriptionId)));

        if (subIdsToLockout.length > 0) {
            const lockedSubs = await db.update(instituteSubscriptionsTable)
                .set({
                    status: "UNPAID",
                    updatedAt: new Date()
                })
                .where(
                    and(
                        eq(instituteSubscriptionsTable.status, "PAST_DUE"),
                        inArray(instituteSubscriptionsTable.id, subIdsToLockout)
                    )
                )
                .returning({ id: instituteSubscriptionsTable.id });
            console.log(`[Expiry Job] Lockout enforced: transitioned ${lockedSubs.length} PAST_DUE subscription(s) to UNPAID.`);
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
