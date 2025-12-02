import { boolean, date, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { genderEnum, usersTable } from "../user/users.model";
import { academicYearsTable, classesTable, sectionsTable } from "../acedemics/academics.model";

export const castCategoryEnum = pgEnum('category', ['GENERAL', 'OBC', 'SC/ST']);
export const studentStatusEnum = pgEnum('status', ['ACTIVE', 'ALUMINI', 'WITHDRAWN', 'TRANSFRRED']);
export const studentAttendanceStatus = pgEnum('status', ['Present', 'Absent', 'Late', 'Leave']);

export const studentsTable = pgTable('studentsTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    admissionNo: integer('addmissionNo'),
    userId: uuid('userId').references(() => usersTable.id, { onDelete: 'cascade' }),
    firstName: varchar('firstName', { length: 50 }).notNull(),
    lastName: varchar('lastName', { length: 50 }).notNull(),
    DOB: date('DOB').notNull(),
    gender: genderEnum('gender').notNull(),
    currentClassId: integer('currentClassId').references(() => classesTable.id).notNull(),
    currentSectionId: integer('currentSectionId').references(() => sectionsTable.id).notNull(),
    category: castCategoryEnum('category'),
    status: studentStatusEnum('status').notNull(),
    rollNo: integer('rollNo').notNull()

})

export const studentEnrollmentTable = pgTable('studentEnrollmentTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    studentId: integer('studentId').references(() => studentsTable.id, { onDelete: 'cascade' }).notNull(),
    classId: integer('classId').references(() => classesTable.id, { onDelete: 'cascade' }).notNull(),
    sectionId: integer('sectionId').references(() => sectionsTable.id, { onDelete: 'cascade' }).notNull(),
    academicYearId: integer('academicYearId').references(() => academicYearsTable.id, { onDelete: 'cascade' }).notNull(),
    rollNo: varchar('rollNo', { length: 20 }),
    enrollmentDate: date('enrollmentDate').notNull(),
    status: studentStatusEnum('status').notNull(),
    exitDate: date('exitDate'),
    exitReason: varchar('exitReason', { length: 400 }),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),

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