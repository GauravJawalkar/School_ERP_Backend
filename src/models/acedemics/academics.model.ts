import { boolean, date, integer, pgEnum, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { instituteProfileTable } from "../institute/instituteProfile.model";
import { staffTable } from "../staff/staff.model";

export const classSectionEnums = pgEnum('classSectionName', ['A', 'B', 'C', 'D', 'E', 'F'])
export const subjectTypeEnum = pgEnum('subjectType', ['THEORY', 'PRACTICAL', 'LAB'])
export const daysOfWeekEnum = pgEnum('daysOfWeek', ['1', '2', '3', '4', '5', '6', '7'])

export const academicYearsTable = pgTable('academicYearsTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    instituteId: integer('instituteId').notNull().references(() => instituteProfileTable.id),
    name: varchar('name').notNull(),
    startDate: date('startDate').notNull(),
    endDate: date('endDate').notNull(),
    isActive: boolean('isActiveYear').notNull(),
})

export const admissionsTable = pgTable('admissionsTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    academicYearId: integer('academicYearId').references(() => academicYearsTable.id, { onDelete: 'cascade' }).notNull(),
    admissionDate: date('admissionDate').notNull(),
    lastAdmissionNo: integer('lastAdmissionNo').notNull(),
})

export const classesTable = pgTable('classesTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    instituteId: integer('instituteId').references(() => instituteProfileTable.id).notNull(),
    className: varchar('className', { length: 50 }).notNull(),
    orderIndex: integer('orderIndex').notNull(),
    academicYearId: integer('academicYearId').references(() => academicYearsTable.id, { onDelete: 'cascade' }).notNull(),
    capacity: integer('capacity'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const sectionsTable = pgTable('sectionsTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    name: classSectionEnums('name').notNull(),
    classId: integer('classId').references(() => classesTable.id, { onDelete: 'cascade' }),
    classTeacherId: integer('classTeacherId').references(() => staffTable.id, { onDelete: 'set null' }),
    roomNumber: varchar('roomNumber', { length: 20 }),
    capacity: integer('capacity'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const subjectsTable = pgTable('subjectsTable', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    instituteId: integer("instituteId").references(() => instituteProfileTable.id),
    name: varchar('name', { length: 50 }).notNull(),
    code: varchar('code', { length: 20 }),
    type: subjectTypeEnum('type').notNull()
})

export const subjectAllocationsTable = pgTable('subjectAllocationsTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    academicYearId: integer('academicYearId').references(() => academicYearsTable.id, { onDelete: 'cascade' }).notNull(),
    sectionId: integer('sectionId').references(() => sectionsTable.id, { onDelete: 'cascade' }).notNull(),
    subjectId: integer('subjectId').references(() => subjectsTable.id, { onDelete: 'cascade' }).notNull(),
    teacherId: integer('teacherId').references(() => staffTable.id, { onDelete: 'cascade' })
})

export const timeTableSlotsTable = pgTable('timeTableSlotsTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    sectionId: integer('sectionId').references(() => sectionsTable.id, { onDelete: 'cascade' }).notNull(),
    dayOfWeek: daysOfWeekEnum('dayOfWeek').notNull(),
    startTime: varchar('startTime', { length: 10 }).notNull(),
    endTime: varchar('endTime', { length: 10 }).notNull(),
    subjectAllocationId: integer('subjectAllocationId').references(() => subjectAllocationsTable.id, { onDelete: 'cascade' }).notNull(),
})