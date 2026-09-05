import type { Request, Response } from "express";
import { db } from "../db";
import { rolesTable, rolePermissionTable, permissionsTable } from "../models";
import { eq, or, and } from "drizzle-orm";
import { getLoggedInUserDetails } from "../services/auth.service";

const getRolesList = async (req: Request, res: Response) => {
    try {
        const { isSuperAdmin, instituteId } = await getLoggedInUserDetails(req);

        // 1. Fetch relevant roles based on admin role scope
        let roles;
        if (isSuperAdmin) {
            // Super admins manage and view global templates
            roles = await db
                .select()
                .from(rolesTable)
                .where(eq(rolesTable.isSystemRole, true));
        } else {
            // School admins see both read-only system defaults AND their custom school-specific roles
            roles = await db
                .select()
                .from(rolesTable)
                .where(
                    or(
                        eq(rolesTable.isSystemRole, true),
                        eq(rolesTable.instituteId, instituteId)
                    )
                );
        }

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
            assignedUsersCount: role.isSystemRole ? 3 : 0, // Active users bind count placeholder
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
};

const createRole = async (req: Request, res: Response) => {
    try {
        const { name, description, isSystemRole, permissions, expiryDate } = req.body;
        const { instituteId, loggedInUserId, isSuperAdmin, isSchoolAdmin } = await getLoggedInUserDetails(req);

        if (!isSuperAdmin && !isSchoolAdmin) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access.",
                status: 401
            });
        }

        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Role name is required.",
                status: 400
            });
        }

        // SUPER_ADMIN can create standard system roles.
        // SCHOOL_ADMIN can only create custom roles bound to their institute.
        const roleIsSystem = isSuperAdmin ? (isSystemRole ?? true) : false;
        const targetName = name.toUpperCase().replace(/\s+/g, "_");

        // Verify if a role with that name already exists in target scope
        const [existingRole] = await db
            .select()
            .from(rolesTable)
            .where(
                and(
                    eq(rolesTable.name, targetName),
                    roleIsSystem 
                        ? eq(rolesTable.isSystemRole, true) 
                        : eq(rolesTable.instituteId, instituteId)
                )
            )
            .limit(1);

        if (existingRole) {
            return res.status(400).json({
                success: false,
                message: `A role with name "${name}" already exists in this scope.`,
                status: 400
            });
        }

        const expiry = expiryDate ? new Date(expiryDate) : null;

        // Perform transactional creation
        const result = await db.transaction(async (tx) => {
            const [insertedRole] = await tx
                .insert(rolesTable)
                .values({
                    name: targetName,
                    instituteId: roleIsSystem ? null : instituteId,
                    description: description || `Custom security profile for ${name}`,
                    createdBy: loggedInUserId,
                    expiryDate: expiry,
                    isSystemRole: roleIsSystem,
                })
                .returning();

            if (!insertedRole) {
                throw new Error("Failed to insert role record.");
            }

            // Assign baseline permissions if provided (deduplicated)
            if (Array.isArray(permissions) && permissions.length > 0) {
                const uniquePermIds: number[] = [...new Set(permissions.map(Number))].filter(Boolean);
                if (uniquePermIds.length > 0) {
                    await tx
                        .insert(rolePermissionTable)
                        .values(
                            uniquePermIds.map((permId: number) => ({
                                roleId: insertedRole.id,
                                permissionId: permId,
                            }))
                        );
                }
            }

            return insertedRole;
        });

        return res.status(201).json({
            success: true,
            message: "Role provisioned successfully.",
            data: result,
            status: 201
        });

    } catch (error: any) {
        console.error("Error creating role:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create security role.",
            error: error.message,
            status: 500
        });
    }
};

const updateRolePermissions = async (req: Request, res: Response) => {
    try {
        const { roleId, permissions } = req.body;
        const { instituteId, isSuperAdmin, isSchoolAdmin } = await getLoggedInUserDetails(req);

        if (!isSuperAdmin && !isSchoolAdmin) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access.",
                status: 401
            });
        }

        if (!roleId) {
            return res.status(400).json({
                success: false,
                message: "Role ID is required.",
                status: 400
            });
        }

        if (!Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: "Permissions must be an array of numeric IDs.",
                status: 400
            });
        }

        // Fetch target role details
        const [targetRole] = await db
            .select()
            .from(rolesTable)
            .where(eq(rolesTable.id, roleId))
            .limit(1);

        if (!targetRole) {
            return res.status(404).json({
                success: false,
                message: "Role not found.",
                status: 404
            });
        }

        // Verify write guards:
        // - System default templates can ONLY be modified by SUPER_ADMIN
        // - School-specific custom roles can only be modified by matching institute's SCHOOL_ADMIN
        if (targetRole.isSystemRole && !isSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: "Only system administrators can modify standard default templates.",
                status: 403
            });
        }

        if (!targetRole.isSystemRole && !isSuperAdmin && targetRole.instituteId !== instituteId) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to modify custom roles outside your school.",
                status: 403
            });
        }

        // Sync mappings inside database transaction
        await db.transaction(async (tx) => {
            // Delete current mappings
            await tx
                .delete(rolePermissionTable)
                .where(eq(rolePermissionTable.roleId, roleId));

            // Insert new mappings (deduplicated)
            const uniquePermIds: number[] = [...new Set(permissions.map(Number))].filter(Boolean);
            if (uniquePermIds.length > 0) {
                await tx
                    .insert(rolePermissionTable)
                    .values(
                        uniquePermIds.map((permId: number) => ({
                            roleId: roleId,
                            permissionId: permId,
                        }))
                    );
            }
        });

        return res.status(200).json({
            success: true,
            message: "Role capabilities synchronized successfully.",
            status: 200
        });

    } catch (error: any) {
        console.error("Error updating role permissions:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update role permissions.",
            error: error.message,
            status: 500
        });
    }
};

const getPermissionsList = async (req: Request, res: Response) => {
    try {
        const permissions = await db
            .select()
            .from(permissionsTable);

        const grouped: Record<string, any[]> = {};
        permissions.forEach((p) => {
            if (!grouped[p.module]) {
                grouped[p.module] = [];
            }
            const currentGroup = grouped[p.module];
            if (currentGroup) {
                currentGroup.push({
                    id: p.id,
                    slug: p.slug,
                    description: p.description || `Capability for ${p.slug}`
                });
            }
        });

        const data = Object.keys(grouped).map((module) => ({
            module,
            displayName: module.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) + " Management",
            permissions: grouped[module] || []
        }));

        return res.status(200).json({
            success: true,
            data,
            status: 200
        });
    } catch (error: any) {
        console.error("Error in getPermissionsList controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch operational permissions list",
            error: error.message,
            status: 500
        });
    }
};

const deleteRole = async (req: Request, res: Response) => {
    try {
        const { roleId } = req.body;
        const { instituteId, isSuperAdmin, isSchoolAdmin } = await getLoggedInUserDetails(req);

        if (!isSuperAdmin && !isSchoolAdmin) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access.",
                status: 401
            });
        }

        if (!roleId) {
            return res.status(400).json({
                success: false,
                message: "Role ID is required.",
                status: 400
            });
        }

        // Fetch the target role
        const [targetRole] = await db
            .select()
            .from(rolesTable)
            .where(eq(rolesTable.id, roleId))
            .limit(1);

        if (!targetRole) {
            return res.status(404).json({
                success: false,
                message: "Role not found.",
                status: 404
            });
        }

        // Security guards
        if (targetRole.isSystemRole && !isSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: "Action denied. Only platform administrators can delete system default templates.",
                status: 403
            });
        }

        if (!targetRole.isSystemRole && !isSuperAdmin && targetRole.instituteId !== instituteId) {
            return res.status(403).json({
                success: false,
                message: "Action denied. You can only delete custom roles created for your own school.",
                status: 403
            });
        }

        // Perform clean cascade delete in a transaction
        await db.transaction(async (tx) => {
            await tx
                .delete(rolePermissionTable)
                .where(eq(rolePermissionTable.roleId, roleId));

            await tx
                .delete(rolesTable)
                .where(eq(rolesTable.id, roleId));
        });

        return res.status(200).json({
            success: true,
            message: "Role deleted successfully.",
            status: 200
        });
    } catch (error: any) {
        console.error("Error deleting role:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete role.",
            error: error.message,
            status: 500
        });
    }
};

export { getRolesList, createRole, updateRolePermissions, getPermissionsList, deleteRole };