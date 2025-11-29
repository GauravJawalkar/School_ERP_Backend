import { pgTable, varchar, date, integer, uuid, numeric, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "../user/users.model";

export const staffTable = pgTable('staffTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    userId: uuid('userId').references(() => usersTable.id).notNull(),
    employeeCode: varchar('employeeCode', { length: 50 }).notNull(),
    firstName: varchar('firstName', { length: 100 }).notNull(),
    lastName: varchar('lastName', { length: 100 }).notNull(),
    designation: varchar('lastName', { length: 100 }).notNull(),
    department: varchar('department').notNull(),
    joining_date: date('joiningDate').notNull(),
    salaryBasic: numeric('salaryBasic', { precision: 10, scale: 2 }).notNull(),
    bankDetails: jsonb('bankDetails').notNull()
})