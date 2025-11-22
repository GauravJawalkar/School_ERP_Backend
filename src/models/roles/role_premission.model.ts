import { pgTable, serial, integer } from "drizzle-orm/pg-core";
import { rolesTable } from "./roles.model";
import { permissionsTable } from "./permissions.model";

export const rolePermissionTable = pgTable('rolePermissionTable', {
    id: serial('id').primaryKey().unique().notNull(),
    roleId: serial('roleId').notNull().references(() => rolesTable.id),
    permissionId: integer('permissionId').notNull().references(() => permissionsTable.id)
})