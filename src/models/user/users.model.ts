import { pgTable, integer, varchar, uuid, pgEnum, boolean, timestamp } from "drizzle-orm/pg-core";
import { instituteProfileTable } from "../institute/instituteProfile.model";

export const genderEnum = pgEnum('gender', ['MALE', 'FEMALE', 'OTHER']);

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

export { usersTable }