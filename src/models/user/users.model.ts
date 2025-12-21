import { pgTable, integer, varchar, uuid, pgEnum, boolean, timestamp, text } from "drizzle-orm/pg-core";
import { instituteProfileTable } from "../institute/instituteProfile.model";
import { studentsTable } from "../students/students.model";

export const genderEnum = pgEnum('gender', ['MALE', 'FEMALE', 'OTHER']);
export const relationEnum = pgEnum('relation', ['FATHER', 'MOTHER', 'GUARDIAN']);
export const primaryContactEnum = pgEnum('primaryContact', ['FATHER', 'MOTHER', 'GUARDIAN'])
export const occupationEnum = pgEnum('occupation', ['BUSINESS', 'JOB', 'HOUSE_WIFE'])

const usersTable = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: varchar("firstname", { length: 255 }).notNull(),
    lastName: varchar("lastname", { length: 255 }).notNull(),
    instituteId: integer('instituteId').notNull().references(() => instituteProfileTable.id),
    profileImage: varchar("profileImage"),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 10 }).notNull().unique(),
    gender: genderEnum("gender").notNull(),
    password_hash: varchar("password").notNull(),
    isActive: boolean('is_active').notNull().default(true),
    lastLogin: timestamp('last_login').notNull().defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

const resetPasswordTable = pgTable("resetPasswordTable", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid("userId").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    otp: varchar("otp").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp('created_at').defaultNow(),
})

const parentsTable = pgTable("parentsTable", {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    studentId: integer("studentId").references(() => studentsTable.id, { onDelete: 'cascade' }).notNull(),
    instituteId: integer('instituteId').references(() => instituteProfileTable.id, { onDelete: 'cascade' }).notNull(),
    // Father Details
    fatherName: varchar("fatherName", { length: 100 }).notNull(),
    fatherOccupation: occupationEnum('fatherOccupation'),
    fatherQualification: varchar('fatherQualification', { length: 100 }),
    fatherPhone: varchar('fatherPhone', { length: 15 }),
    fatherEmail: varchar('fatherEmail', { length: 100 }),
    fatherAadhar: varchar('fatherAadhar', { length: 12 }),
    motherName: varchar("motherName", { length: 100 }).notNull(),
    // Mother Details
    motherOccupation: varchar('motherOccupation', { length: 100 }),
    motherQualification: occupationEnum('motherOccupation'),
    motherPhone: varchar('motherPhone', { length: 15 }),
    motherEmail: varchar('motherEmail', { length: 100 }),
    motherAadhar: varchar('motherAadhar', { length: 12 }),
    // Guardian Details if any
    guardianName: varchar('guardianName', { length: 100 }),
    guardianRelation: varchar('guardianRelation', { length: 50 }),
    guardianPhone: varchar('guardianPhone', { length: 15 }),
    guardianEmail: varchar('guardianEmail', { length: 100 }),
    guardianOccupation: varchar('guardianOccupation', { length: 100 }),
    // Important details for school
    primaryContactPerson: primaryContactEnum('primaryContactPerson'),
    primaryPhone: varchar('primaryPhone', { length: 15 }).notNull(),
    whatsAppNo: varchar("whatsAppNo", { length: 20 }),
    // Address Details
    address: text('address').notNull(),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    pincode: varchar('pincode', { length: 10 }),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

const studentParentMapTable = pgTable("studentParentMapTable", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    studentId: integer("studentId").references(() => studentsTable.id, { onDelete: 'cascade' }).notNull(),
    parentId: integer('parentId').references(() => parentsTable.id, { onDelete: 'cascade' }).notNull(),
    relation: relationEnum("relationship").notNull(),
    isEmergencyContact: boolean("isEmergencyContact").default(true)
});

export { usersTable, resetPasswordTable, parentsTable, studentParentMapTable }