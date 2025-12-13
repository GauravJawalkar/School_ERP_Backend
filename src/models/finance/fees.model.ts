import { pgTable, varchar, integer, pgEnum, text, decimal, boolean, timestamp, date, uuid, jsonb } from "drizzle-orm/pg-core";
import { instituteProfileTable } from "../institute/instituteProfile.model";
import { academicYearsTable, classesTable } from "../acedemics/academics.model";
import { studentsTable } from "../students/students.model";
import { usersTable } from "../user/users.model";

export const feeTypeEnum = pgEnum('feeType', ["ACADEMIC", "TRANSPORT", "LIBRARY", "EXAM", "OTHER"]);
export const feeFrequencyEnum = pgEnum('feeFrequency', ['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUALLY']);
export const invoiceStatusEnum = pgEnum('invoiceStatus', ["UNPAID", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]);
export const paymentModeEnum = pgEnum('paymentMode', ["CASH", "UPI", "CHEQUE", "BANK_TRANSFER", "CARD", "ONLINE"]);
export const transactionStatusEnum = pgEnum('transactionStatus', ['SUCCESS', 'PENDING', 'FAILED', 'REFUNDED']);

export const feeHeadsTable = pgTable("feeHeadsTable", {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    instituteId: integer('instituteId').references(() => instituteProfileTable.id, { onDelete: 'cascade' }).notNull(),
    feeName: varchar('feeName', { length: 100 }).notNull(),
    description: text('description'),
    ledgerName: varchar('ledgerName', { length: 100 }),
    feeType: feeTypeEnum('feeType').notNull(),
    taxPercentage: decimal('taxPercentage', { precision: 5, scale: 2 }).default('0.00'),
    isRefundable: boolean('isRefundable').default(false),
    isActive: boolean('isActive').default(true),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// For every class Fees Structure can differ
export const feeStructuresTable = pgTable('feeStructuresTable', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    academicYearId: integer('academicYearId').references(() => academicYearsTable.id, { onDelete: 'cascade' }).notNull(),
    instituteId: integer('instituteId').references(() => instituteProfileTable.id, { onDelete: 'cascade' }).notNull(),
    classId: integer('classId').references(() => classesTable.id, { onDelete: 'cascade' }).notNull(),
    feeHeadId: integer('feeHeadId').references(() => feeHeadsTable.id, { onDelete: 'cascade' }).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    frequency: feeFrequencyEnum('frequency').notNull(),
    isCompulsory: boolean('isCompulsory').default(true),
    dueDay: integer('dueDay'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull()
});

export const feeInstallmentsTable = pgTable('feeInstallmentsTable', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    academicYearId: integer('academicYearId').references(() => academicYearsTable.id, { onDelete: 'cascade' }).notNull(),
    instituteId: integer('instituteId').references(() => instituteProfileTable.id, { onDelete: 'cascade' }).notNull(),
    installmentName: varchar('installmentName', { length: 100 }).notNull(),
    installmentNumber: integer('installmentNumber').notNull(),
    dueDate: date('dueDate').notNull(),
    lateFeeStartDate: date('lateFeeStartDate'),
    finePerDay: decimal('finePerDay', { precision: 10, scale: 2 }).default('0.00'),
    maxFine: decimal('maxFine', { precision: 10, scale: 2 }),
    description: text('description'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export const studentFeeAssignmentsTable = pgTable('studentFeeAssignmentsTable', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    studentId: integer('studentId').references(() => studentsTable.id, { onDelete: 'cascade' }).notNull(),
    instituteId: integer('instituteId').references(() => instituteProfileTable.id, { onDelete: 'cascade' }).notNull(),
    feeStructureId: integer('feeStructureId').references(() => feeStructuresTable.id, { onDelete: 'cascade' }).notNull(),
    // Override amount (for discounts/scholarships)
    // If null, use amount from feeStructuresTable
    customAmount: decimal('customAmount', { precision: 10, scale: 2 }),
    // Scholarship: 50%, 100%, etc.
    discountPercentage: decimal('discountPercentage', { precision: 5, scale: 2 }).default('0.00'),
    // "Merit Scholarship", "Sibling Discount", "Staff Ward"
    discountReason: varchar('discountReason', { length: 200 }),
    // Completely waived (no payment needed)
    isWaived: boolean('isWaived').default(false),
    waivedReason: text('waivedReason'),
    // Final amount after discount: amount - (amount * discount/100)
    effectiveAmount: decimal('effectiveAmount', { precision: 10, scale: 2 }).notNull(),
    assignedAt: timestamp('assignedAt').defaultNow().notNull(),
    assignedBy: uuid('assignedBy').references(() => usersTable.id, { onDelete: 'set null' }),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export const invoicesTable = pgTable('invoicesTable', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    invoiceNo: varchar('invoiceNo', { length: 50 }).unique().notNull(),
    instituteId: integer('instituteId').references(() => instituteProfileTable.id, { onDelete: 'cascade' }).notNull(),
    studentId: integer('studentId').references(() => studentsTable.id, { onDelete: 'cascade' }).notNull(),
    installmentId: integer('installmentId').references(() => feeInstallmentsTable.id, { onDelete: 'cascade' }).notNull(),
    academicYearId: integer('academicYearId').references(() => academicYearsTable.id, { onDelete: 'cascade' }).notNull(),
    totalAmount: decimal('totalAmount', { precision: 10, scale: 2 }).notNull(),
    paidAmount: decimal('paidAmount', { precision: 10, scale: 2 }).notNull().default('0.00'),
    balanceAmount: decimal('balanceAmount', { precision: 10, scale: 2 }).notNull(),
    lateFine: decimal('lateFine', { precision: 10, scale: 2 }).default('0.00'),
    status: invoiceStatusEnum('status').default('UNPAID').notNull(),
    generatedAt: timestamp('generatedAt').defaultNow().notNull(),
    generatedBy: uuid('generatedBy').references(() => usersTable.id, { onDelete: 'set null' }),
    paidAt: timestamp('paidAt'),
    notes: text('notes'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export const invoiceLineItemsTable = pgTable('invoiceLineItemsTable', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    invoiceId: integer('invoiceId').references(() => invoicesTable.id, { onDelete: 'cascade' }).notNull(),
    feeHeadId: integer('feeHeadId').references(() => feeHeadsTable.id, { onDelete: 'cascade' }).notNull(),
    description: varchar('description', { length: 200 }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    taxPercentage: decimal('taxPercentage', { precision: 5, scale: 2 }).default('0.00'),
    taxAmount: decimal('taxAmount', { precision: 10, scale: 2 }).default('0.00'),
    totalAmount: decimal('totalAmount', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const transactionsTable = pgTable('transactionsTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    transactionId: varchar('transactionId', { length: 100 }).unique().notNull(),
    invoiceId: integer('invoiceId').references(() => invoicesTable.id, { onDelete: 'cascade' }).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    paymentMode: paymentModeEnum('paymentMode').notNull(),
    paymentDetails: jsonb('paymentDetails'),
    collectedBy: uuid('collectedBy').references(() => usersTable.id, { onDelete: 'set null' }),
    transactionDate: timestamp('transactionDate').defaultNow().notNull(),
    receiptNo: varchar('receiptNo', { length: 50 }).unique(),
    notes: text('notes'),
    status: transactionStatusEnum('status').default('SUCCESS').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
});


// Fees Flow

// 1. Fee Heads(Components)
//    ↓
// 2. Fee Structure(Amount per class)
//    ↓
// 3. Fee Installments(Payment schedule)
//    ↓
// 4. Student Fee Assignment(Who pays what)
//    ↓
// 5. Invoices(Bills generated)
//    ↓
// 6. Transactions(Actual payments)