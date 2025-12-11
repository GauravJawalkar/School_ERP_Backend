import { pgTable, integer, varchar, uuid, pgEnum, boolean, timestamp } from "drizzle-orm/pg-core";
import { instituteProfileTable } from "../institute/instituteProfile.model";
import { studentsTable } from "../students/students.model";

export const genderEnum = pgEnum('gender', ['MALE', 'FEMALE', 'OTHER']);
export const relationEnum = pgEnum('relation', ['FATHER', 'MOTHER', 'GUARDIAN']);

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
    userId: uuid("userId").references(() => usersTable.id, { onDelete: 'set null' }).notNull(),
    fatherName: varchar("fatherName", { length: 100 }).notNull(),
    motherName: varchar("motherName", { length: 100 }).notNull(),
    fatherContact: varchar("fatherContactNo", { length: 20 }).notNull(),
    motherContact: varchar("motherContactNo", { length: 20 }).notNull(),
    email: varchar("email", { length: 50 }),
    whatsAppNo: varchar("whatsAppNo", { length: 20 }),
    address: varchar("address", { length: 200 }).notNull()
})

const studentParentMapTable = pgTable("studentParentMapTable", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    studentId: integer("studentId").references(() => studentsTable.id, { onDelete: 'cascade' }).notNull(),
    parentId: integer('parentId').references(() => parentsTable.id, { onDelete: 'cascade' }).notNull(),
    relation: relationEnum("relationship").notNull(),
    isEmergencyContact: boolean("isEmergencyContact").default(true)
});

export { usersTable, resetPasswordTable, parentsTable, studentParentMapTable }