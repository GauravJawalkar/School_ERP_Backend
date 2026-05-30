import type { Request, Response } from "express";
import { db } from "../db";
import { rolesTable, rolePermissionTable, permissionsTable } from "../models";
import { eq } from "drizzle-orm";

const getRolesList = async (req: Request, res: Response) => {
    try {
        // 1. Fetch all system defined roles
        const roles = await db
            .select()
            .from(rolesTable)
            .where(eq(rolesTable.isSystemRole, true));

        // 2. Fetch all role-permission mappings joined with permission slugs
        const mappings = await db
            .select({
                roleId: rolePermissionTable.roleId,
                permissionSlug: permissionsTable.slug
            })
            .from(rolePermissionTable)
            .innerJoin(permissionsTable, eq(permissionsTable.id, rolePermissionTable.permissionId));

        // 3. Group mappings by roleId
        const permissionsByRole: Record<number, string[]> = {};
        mappings.forEach((m) => {
            if (!permissionsByRole[m.roleId]) {
                permissionsByRole[m.roleId] = [];
            }
            const currentList = permissionsByRole[m.roleId];
            if (currentList) {
                currentList.push(m.permissionSlug);
            }
        });

        // 4. Combine into final payload structure matching RolesDashboard expectations
        const rolesData = roles.map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description || `Configured security template for ${role.name}`,
            isSystemRole: role.isSystemRole,
            permissionsCount: permissionsByRole[role.id]?.length || 0,
            assignedUsersCount: role.isSystemRole ? 3 : 0, // Descriptive active users bind count placeholder
            permissions: permissionsByRole[role.id] || []
        }));

        return res.status(200).json({
            success: true,
            data: rolesData,
            status: 200
        });

    } catch (error: any) {
        console.error("Error in getRolesList controller:", error);
        return res.status(500).json({
            message: 'Internal Server Error Getting Roles List',
            error: error.message,
            status: 500
        });
    }
}

export { getRolesList }