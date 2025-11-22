import { pgTable, integer, serial, uuid, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "../user/users.model";
import { rolesTable } from "./roles.model";

export const userRoleTable = pgTable('userRoleTable', {
    id: serial('roleId').notNull().primaryKey(),
    userId: uuid('userId').notNull().references(() => usersTable.id),
    roleId: integer('roleId').notNull().references(() => rolesTable.id),
    assignedAt: timestamp('assignedAt').notNull().defaultNow(),
    assignedBy: uuid('assignedBy').notNull().references(() => usersTable.id)
})
