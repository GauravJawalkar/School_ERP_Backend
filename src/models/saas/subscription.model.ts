import { pgTable, integer, varchar, pgEnum, boolean, timestamp, decimal, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { instituteProfileTable } from "../institute/instituteProfile.model";

export const billingPeriodEnum = pgEnum('billingPeriod', ['MONTHLY', 'HALF_YEARLY', 'ANNUALLY']);
export const subscriptionStatusEnum = pgEnum('subscriptionStatus', ['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'UNPAID', 'EXPIRED']);

// 1. Subscription Plans Table
export const subscriptionPlansTable = pgTable('subscriptionPlansTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),             // e.g., 'Basic', 'Standard', 'Enterprise'
    slug: varchar('slug', { length: 100 }).unique().notNull(),      // e.g., 'basic', 'standard', 'enterprise'
    description: varchar('description', { length: 255 }),
    maxStudents: integer('maxStudents').notNull().default(-1),      // -1 means unlimited
    maxStaff: integer('maxStaff').notNull().default(-1),            // -1 means unlimited
    features: jsonb('features').notNull(),                         // JSON containing enabled features/modules: { modules: string[] }
    isActive: boolean('isActive').default(true).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').$onUpdate(() => new Date()),
});

// 2. Subscription Prices Table (Supports Multi-currency and Billing periods)
export const subscriptionPricesTable = pgTable('subscriptionPricesTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    planId: integer('planId').references(() => subscriptionPlansTable.id, { onDelete: 'cascade' }).notNull(),
    billingPeriod: billingPeriodEnum('billingPeriod').notNull(),    // 'MONTHLY', 'HALF_YEARLY', 'ANNUALLY'
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).default('INR').notNull(),
    isActive: boolean('isActive').default(true).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').$onUpdate(() => new Date()),
});

// 3. Institute Subscriptions Table (Tracks the active subscription for each school)
export const instituteSubscriptionsTable = pgTable('instituteSubscriptionsTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    instituteId: integer('instituteId').references(() => instituteProfileTable.id, { onDelete: 'cascade' }).notNull(),
    planId: integer('planId').references(() => subscriptionPlansTable.id).notNull(),
    priceId: integer('priceId').references(() => subscriptionPricesTable.id).notNull(),
    status: subscriptionStatusEnum('status').default('ACTIVE').notNull(),
    startDate: timestamp('startDate').notNull().defaultNow(),
    endDate: timestamp('endDate').notNull(),                         // Calculated based on billing period
    trialEndDate: timestamp('trialEndDate'),
    cancelAtPeriodEnd: boolean('cancelAtPeriodEnd').default(false).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').$onUpdate(() => new Date()),
}, (table) => [
    // Partial unique index ensuring only one row per instituteId can have status = 'ACTIVE' at a time
    uniqueIndex('active_sub_unique_idx')
        .on(table.instituteId)
        .where(sql`status = 'ACTIVE'`),
    // Normal indexes on frequently read fields
    index('institute_sub_inst_idx').on(table.instituteId),
    index('institute_sub_plan_idx').on(table.planId),
    index('institute_sub_status_idx').on(table.status),
]);

// 4. Subscription Payments/Transactions Table
export const subscriptionPaymentsTable = pgTable('subscriptionPaymentsTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    instituteSubscriptionId: integer('instituteSubscriptionId').references(() => instituteSubscriptionsTable.id, { onDelete: 'cascade' }).notNull(),
    instituteId: integer('instituteId').references(() => instituteProfileTable.id, { onDelete: 'cascade' }).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull(),
    paymentGateway: varchar('paymentGateway', { length: 50 }).notNull(), // 'RAZORPAY', 'STRIPE', 'MANUAL'
    gatewayTransactionId: varchar('gatewayTransactionId', { length: 100 }).unique().notNull(), // e.g. MANUAL-<uuid>
    status: varchar('status', { length: 50 }).notNull(),             // 'SUCCESS', 'FAILED', 'PENDING'
    invoiceUrl: varchar('invoiceUrl', { length: 255 }),
    paidAt: timestamp('paidAt'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
});
