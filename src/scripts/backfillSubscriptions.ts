import { db } from "../db";
import {
    instituteProfileTable,
    subscriptionPlansTable,
    subscriptionPricesTable,
    instituteSubscriptionsTable
} from "../models";
import { eq, and } from "drizzle-orm";

async function backfill() {
    console.log("🌱 Starting subscription backfill process...");

    try {
        // 1. Check/Seed Plans
        let enterprisePlan = await db
            .select()
            .from(subscriptionPlansTable)
            .where(eq(subscriptionPlansTable.slug, "enterprise"))
            .limit(1)
            .then(res => res[0]);

        if (!enterprisePlan) {
            console.log("Plans not found. Seeding default subscription plans and prices...");

            // Seed plans
            const [basic] = await db.insert(subscriptionPlansTable).values({
                name: "Basic Plan",
                slug: "basic",
                description: "For small play schools and coaching centres.",
                maxStudents: 250,
                maxStaff: 20,
                features: {
                    modules: [
                        "student", "attendance", "marks", "fees", "admission",
                        "notice", "message", "homework", "certificate",
                        "report_card", "role", "user", "institute", "report", "dashboard"
                    ]
                },
                isActive: true
            }).returning();

            const [standard] = await db.insert(subscriptionPlansTable).values({
                name: "Standard Plan",
                slug: "standard",
                description: "For growing schools with additional needs.",
                maxStudents: 1000,
                maxStaff: 75,
                features: {
                    modules: [
                        "student", "attendance", "marks", "fees", "library", "visitor",
                        "admission", "notice", "message", "homework", "certificate",
                        "report_card", "role", "user", "institute", "report", "dashboard"
                    ]
                },
                isActive: true
            }).returning();

            const [enterprise] = await db.insert(subscriptionPlansTable).values({
                name: "Enterprise Plan",
                slug: "enterprise",
                description: "For large schools with complete infrastructure.",
                maxStudents: -1,
                maxStaff: -1,
                features: {
                    modules: [
                        "student", "attendance", "marks", "fees", "library", "transport",
                        "visitor", "admission", "notice", "message", "homework", "certificate",
                        "report_card", "role", "user", "institute", "report", "dashboard"
                    ]
                },
                isActive: true
            }).returning();

            if (!basic || !standard || !enterprise) {
                throw new Error("Failed to create Basic, Standard, or Enterprise plans during seeding.");
            }

            enterprisePlan = enterprise;

            // Seed Prices
            await db.insert(subscriptionPricesTable).values([
                // Basic
                { planId: basic.id, billingPeriod: "MONTHLY", amount: "1499.00", currency: "INR" },
                { planId: basic.id, billingPeriod: "HALF_YEARLY", amount: "8099.00", currency: "INR" },
                { planId: basic.id, billingPeriod: "ANNUALLY", amount: "14399.00", currency: "INR" },
                // Standard
                { planId: standard.id, billingPeriod: "MONTHLY", amount: "3999.00", currency: "INR" },
                { planId: standard.id, billingPeriod: "HALF_YEARLY", amount: "21599.00", currency: "INR" },
                { planId: standard.id, billingPeriod: "ANNUALLY", amount: "38399.00", currency: "INR" },
                // Enterprise
                { planId: enterprise.id, billingPeriod: "MONTHLY", amount: "9999.00", currency: "INR" },
                { planId: enterprise.id, billingPeriod: "HALF_YEARLY", amount: "53999.00", currency: "INR" },
                { planId: enterprise.id, billingPeriod: "ANNUALLY", amount: "95999.00", currency: "INR" }
            ]);

            console.log("✅ Seeded Basic, Standard, and Enterprise plans & prices.");
        }

        // Get enterprise annual price
        const [enterprisePrice] = await db
            .select()
            .from(subscriptionPricesTable)
            .where(
                and(
                    eq(subscriptionPricesTable.planId, enterprisePlan.id),
                    eq(subscriptionPricesTable.billingPeriod, "ANNUALLY")
                )
            )
            .limit(1);

        if (!enterprisePrice) {
            throw new Error("Enterprise annual price not found. Cannot proceed with backfill.");
        }

        // 2. Fetch all ACTIVE institutes
        const activeInstitutes = await db
            .select()
            .from(instituteProfileTable)
            .where(eq(instituteProfileTable.status, "ACTIVE"));

        console.log(`Found ${activeInstitutes.length} ACTIVE institute(s) to evaluate.`);

        let backfilledCount = 0;

        for (const inst of activeInstitutes) {
            // Check for existing active subscription
            const [existingSub] = await db
                .select()
                .from(instituteSubscriptionsTable)
                .where(
                    and(
                        eq(instituteSubscriptionsTable.instituteId, inst.id),
                        eq(instituteSubscriptionsTable.status, "ACTIVE")
                    )
                )
                .limit(1);

            if (!existingSub) {
                // Insert Enterprise subscription (+5 years)
                const fiveYearsFromNow = new Date();
                fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);

                await db.insert(instituteSubscriptionsTable).values({
                    instituteId: inst.id,
                    planId: enterprisePlan.id,
                    priceId: enterprisePrice.id,
                    status: "ACTIVE",
                    startDate: new Date(),
                    endDate: fiveYearsFromNow,
                    cancelAtPeriodEnd: false
                });

                console.log(`[Backfilled] Assigned Enterprise Plan to institute: ${inst.schoolName} (ID: ${inst.id})`);
                backfilledCount++;
            } else {
                console.log(`[Skipped] Institute already has active subscription: ${inst.schoolName} (ID: ${inst.id})`);
            }
        }

        console.log(`✅ Completed backfill process. Backfilled: ${backfilledCount} institutes.`);
    } catch (error) {
        console.error("❌ Backfill process failed:", error);
    }
    process.exit(0);
}

backfill();
