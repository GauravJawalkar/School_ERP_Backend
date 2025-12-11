import { pgTable, varchar, integer, pgEnum, text, decimal, boolean, timestamp, date, uuid } from "drizzle-orm/pg-core";
import { instituteProfileTable } from "../institute/instituteProfile.model";
import { academicYearsTable, classesTable } from "../acedemics/academics.model";
import { studentsTable } from "../students/students.model";
import { usersTable } from "../user/users.model";

export const feeTypeEnum = pgEnum('feeName', ["ACADEMIC", "TRANSPORT", "LIBRARY", "EXAM", "OTHER"]);
export const feeFrequencyEnum = pgEnum('feeFrequency', ['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUALLY']);

export const feeHeadsTable = pgTable("feeHeadsTable ", {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    instituteId: integer('instituteId').references(() => instituteProfileTable.id, { onDelete: 'cascade' }).notNull(),
    feeName: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    ledgerName: varchar('ledgerName', { length: 100 }),
    feeType: feeTypeEnum('feeType').notNull(),
    taxPercentage: decimal('taxPercentage', { precision: 5, scale: 2 }).default('0.00'),
    isRefundable: boolean('isRefundable').default(false),
    isActive: boolean('isActive').default(true),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

// For every class Fees Structure can differ
export const feeStructuresTable = pgTable('feeStructuresTable', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    academicYearId: integer('academicYearId').references(() => academicYearsTable.id, { onDelete: 'cascade' }).notNull(),
    instituteId: integer('instituteId').references(() => instituteProfileTable.id, { onDelete: 'cascade' }).notNull(),
    classId: integer('classId').references(() => classesTable.id, { onDelete: 'cascade' }).notNull(),
    feeHeadId: integer('feeHeadId').references(() => feeHeadsTable.id, { onDelete: 'cascade' }).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),//Base amount before tax
    frequency: feeFrequencyEnum('frequency').notNull(),
    isCompulsory: boolean('isCompulsory').default(true),
    dueDay: integer('dueDay'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull()
})

export const feeInstallmentsTable = pgTable('feeInstallmentsTable', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    academicYearId: integer('academicYearId').references(() => academicYearsTable.id, { onDelete: 'cascade' }).notNull(),
    instituteId: integer('instituteId').references(() => instituteProfileTable.id, { onDelete: 'cascade' }).notNull(),
    installmentName: varchar('name', { length: 100 }).notNull(),
    installmentNumber: integer('installmentNumber').notNull(),
    dueDate: date('dueDate').notNull(),
    lateFeeStartDate: date('lateFeeStartDate'),
    finePerDay: decimal('finePerDay', { precision: 10, scale: 2 }).default('0.00'),
    maxFine: decimal('maxFine', { precision: 10, scale: 2 }),
    description: text('description'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const studentFeeAssignmentsTable = pgTable('studentFeeAssignmentsTable ', {
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
})


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