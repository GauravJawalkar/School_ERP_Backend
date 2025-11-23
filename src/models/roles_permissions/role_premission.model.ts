import { pgTable, integer } from "drizzle-orm/pg-core";
import { rolesTable } from "./roles.model";
import { permissionsTable } from "./permissions.model";

export const rolePermissionTable = pgTable('rolePermissionTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    roleId: integer('roleId').notNull().references(() => rolesTable.id),
    permissionId: integer('permissionId').notNull().references(() => permissionsTable.id)
})