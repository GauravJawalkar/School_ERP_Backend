import { boolean, date, integer, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { instituteProfileTable } from "../institute/instituteProfile.model";
import { staffTable } from "../staff/staff.model";
import { usersTable } from "../user/users.model";

export const classSectionEnums = pgEnum('classSectionName', ['A', 'B', 'C', 'D', 'E', 'F'])
export const subjectTypeEnum = pgEnum('subjectType', ['THEORY', 'PRACTICAL', 'LAB'])
export const daysOfWeekEnum = pgEnum('daysOfWeek', ['1', '2', '3', '4', '5', '6', '7'])
export const applicationStatusEnum = pgEnum('applicationStatus', ['PENDING', 'APPROVED', 'REJECTED', 'INQUIRY']);

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
    instituteId: integer('instituteId').references(() => instituteProfileTable.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('userId').references(() => usersTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    board: varchar('board', { length: 100 }).notNull(),
    parentPhoneNo: varchar('parentPhoneNo', { length: 15 }).notNull(),
    applicationStatus: applicationStatusEnum('status').notNull().default('PENDING'),
    classId: integer('classId').references(() => classesTable.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const classesTable = pgTable('classesTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    instituteId: integer('instituteId').references(() => instituteProfileTable.id).notNull(),
    className: varchar('className', { length: 50 }).notNull(),
    orderIndex: integer('orderIndex'),
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
    type: subjectTypeEnum('type').notNull(),
    description: varchar('description', { length: 255 }),
    isActive: boolean('isActive').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const classSubjectsTable = pgTable('classSubjectsTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    classId: integer('classId').references(() => classesTable.id, { onDelete: 'cascade' }).notNull(),
    subjectId: integer('subjectId').references(() => subjectsTable.id, { onDelete: 'cascade' }).notNull(),
    academicYearId: integer('academicYearId').references(() => academicYearsTable.id, { onDelete: 'cascade' }).notNull(),
    displayName: varchar('displayName', { length: 100 }),
    maxMarks: integer('maxMarks'),
    minPassingMarks: integer('minPassingMarks'),
    isCompulsory: boolean('isCompulsory').default(true),
    isActive: boolean('isActive').default(true),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const subjectAllocationsTable = pgTable('subjectAllocationsTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    academicYearId: integer('academicYearId').references(() => academicYearsTable.id, { onDelete: 'cascade' }).notNull(),
    classId: integer('classId').references(() => classesTable.id, { onDelete: 'cascade' }).notNull(),
    sectionId: integer('sectionId').references(() => sectionsTable.id, { onDelete: 'cascade' }).notNull(),
    subjectId: integer('subjectId').references(() => subjectsTable.id, { onDelete: 'cascade' }).notNull(),
    teacherId: integer('teacherId').references(() => staffTable.id, { onDelete: 'cascade' })
})

export const timeTableSlotsTable = pgTable('timeTableSlotsTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    classId: integer('classId').references(() => classesTable.id, { onDelete: 'cascade' }).notNull(),
    sectionId: integer('sectionId').references(() => sectionsTable.id, { onDelete: 'cascade' }).notNull(),
    dayOfWeek: daysOfWeekEnum('dayOfWeek').notNull(),
    startTime: varchar('startTime', { length: 10 }).notNull(),
    endTime: varchar('endTime', { length: 10 }).notNull(),
    subjectAllocationId: integer('subjectAllocationId').references(() => subjectAllocationsTable.id, { onDelete: 'cascade' }).notNull(),
})