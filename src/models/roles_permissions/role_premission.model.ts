import { pgTable, integer, unique } from "drizzle-orm/pg-core";
import { rolesTable } from "./roles.model";
import { permissionsTable } from "./permissions.model";

export const rolePermissionTable = pgTable('rolePermissionTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    roleId: integer('roleId').notNull().references(() => rolesTable.id, { onDelete: 'cascade' }),
    permissionId: integer('permissionId').notNull().references(() => permissionsTable.id, { onDelete: 'cascade' })
}, (table) => [
    unique("role_permission_unique").on(table.roleId, table.permissionId)
])