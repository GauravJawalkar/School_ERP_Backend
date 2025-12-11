import { boolean, date, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "../user/users.model";
import { classesTable, sectionsTable } from "../acedemics/academics.model";
import { instituteProfileTable } from "../institute/instituteProfile.model";

export const castCategoryEnum = pgEnum('category', ['GENERAL', 'OBC', 'SC/ST']);
export const studentStatusEnum = pgEnum('status', ['ACTIVE', 'ALUMINI', 'WITHDRAWN', 'TRANSFRRED']);
export const studentAttendanceStatus = pgEnum('status', ['PRESENT', 'ABSENT', 'LATE', 'LEAVE']);
const genderEnum = pgEnum('gender', ['MALE', 'FEMALE', 'OTHER']);

export const studentsTable = pgTable('studentsTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    instituteId: integer('instituteId').references(() => instituteProfileTable.id, { onDelete: 'cascade' }).notNull(),
    admissionNo: integer('addmissionNo'),
    userId: uuid('userId').references(() => usersTable.id, { onDelete: 'cascade' }),
    firstName: varchar('firstName', { length: 50 }).notNull(),
    lastName: varchar('lastName', { length: 50 }).notNull(),
    DOB: date('DOB').notNull(),
    gender: genderEnum('gender').notNull(),
    currentClassId: integer('currentClassId').references(() => classesTable.id).notNull(),
    currentSectionId: integer('currentSectionId').references(() => sectionsTable.id),
    category: castCategoryEnum('category'),
    status: studentStatusEnum('status').notNull(),
    rollNo: integer('rollNo')
})

export const studentDocumentsTable = pgTable('studentDocumentsTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    studentId: integer('studentId').references(() => studentsTable.id, { onDelete: 'cascade' }).notNull(),
    documentType: varchar('documentType', { length: 50 }).notNull(),
    documentName: varchar('documentName', { length: 100 }).notNull(),
    documentUrl: text('document_url').notNull(),//link->Cloudinary
    isVerified: boolean('isVerified').default(false),
    uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
})

export const studentAttendance = pgTable('studentAttendance', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    studentId: integer('studentId').references(() => studentsTable.id, { onDelete: 'cascade' }).notNull(),
    status: studentAttendanceStatus('status').notNull(),
    remarks: text('remarks')
})