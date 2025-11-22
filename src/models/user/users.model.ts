import { pgTable, integer, varchar, uuid, pgEnum, boolean, timestamp } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
    "SUPER_ADMIN",       // SaaS Level: Can manage subscriptions, schools
    "SCHOOL_ADMIN",      // School Level: Can manage the entire school setup
    "TEACHER",           // Staff: Access to Academics, Attendance, LMS
    "ACCOUNTANT",        // Staff: Access to Finance, Fees
    "LIBRARIAN",         // Staff: Access to Library module
    "RECEPTIONIST",      // Staff: Access to Admissions, Visitors
    "TRANSPORT_MANAGER", // Staff: Access to Bus Routes, Drivers
    "STUDENT",           // End User: View only access
    "PARENT"             // End User: View child data + Pay fees
]);

export const genderEnum = pgEnum('gender', ['MALE', 'FEMALE', 'OTHER']);

const usersTable = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: varchar("firstname", { length: 255 }).notNull(),
    lastName: varchar("lastname", { length: 255 }).notNull(),
    instituteId: integer('instituteId').notNull(), // TODO: Add foreign key reference to institutes table
    profileImage: varchar("profileImage"),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 10 }).notNull().unique(),
    gender: genderEnum("gender").notNull(),
    password_hash: varchar("password").notNull(),
    roleType: userRoleEnum("role").notNull().default("STUDENT"),
    isActive: boolean('is_active').notNull().default(true),
    lastLogin: timestamp('last_login').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

export { usersTable }