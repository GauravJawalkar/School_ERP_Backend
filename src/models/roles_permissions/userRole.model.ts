import { pgTable, integer, uuid, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "../user/users.model";
import { rolesTable } from "./roles.model";

export const userRoleTable = pgTable('userRoleTable', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid('userId').notNull().references(() => usersTable.id),
    roleId: integer('roleId').notNull().references(() => rolesTable.id),
    assignedAt: timestamp('assignedAt').defaultNow(),
    assignedBy: uuid('assignedBy').references(() => usersTable.id)
})
