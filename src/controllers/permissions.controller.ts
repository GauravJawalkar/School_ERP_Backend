import type { Request, Response } from "express";
import type { TokenUser } from "../interface";
import { db } from "../db";
import { instituteProfileTable, permissionsTable, rolePermissionTable, rolesTable, userRoleTable, usersTable } from "../models";
import { and, eq } from "drizzle-orm";
import { getLoggedInUserDetails } from "../services/auth.service";

//Next Features to add
// 1. The role must have an expiry like after some time or a specific time it will get expired and then the user cannot just have the permissions (Future Feature)

const assignCustomRole = async (req: Request, res: Response) => {
    try {

        const { userId, permissions, roleName, expiryDate } = req.body;

        const { instituteId, roles, loggedInUserId } = await getLoggedInUserDetails(req);

        // Double check after the checkUserRole Middleware
        const isAllowedToAssignRole = roles.includes('SUPER_ADMIN') || roles.includes('SCHOOL_ADMIN');

        if (!isAllowedToAssignRole) {
            return res.status(401).json({
                message: "Action Denied. You are not allowed to assign any permissions",
                status: 401
            })
        }

        if (!Array.isArray(permissions) || permissions.length === 0) {
            return res.status(400).json({
                message: "Please provide permissions that has to be assigned"
            })
        }

        // Remove duplicate permission IDs from the permissions array
        const uniquePermissions: number[] = [...new Set(permissions)];

        // Check role Name
        if (!roleName || roleName.trim() === '' || !userId || userId.trim() === '') {
            return res.status(400).json({
                message: "Please provide a valid role name",
                status: 400
            })
        }

        // Check only the user for a specific institute like the one who is loggedIn and is assigning the permission too
        const [userExist] = await db
            .select()
            .from(usersTable)
            .where(
                and(
                    eq(usersTable.id, userId),
                    eq(usersTable.instituteId, instituteId)
                )
            ).limit(1);

        if (!userExist) {
            return res.status(404).json({
                message: 'User not found or the user does not belong to your institute',
                status: 404
            })
        }


        const [isInstituteActive] = await db
            .select()
            .from(instituteProfileTable)
            .where(
                and(
                    eq(instituteProfileTable.id, instituteId),
                    eq(instituteProfileTable.status, 'ACTIVE')
                )
            ).limit(1);

        if (!isInstituteActive) {
            return res.status(403).json({
                message: 'Your institute is not active. Please contact support.',
                status: 403
            })
        }

        const expiry = expiryDate ? new Date(expiryDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const [newRole] = await db
            .insert(rolesTable)
            .values({
                name: roleName,
                instituteId: instituteId,
                description: `Custom role created for user ${userId} with specific permissions`,
                createdBy: loggedInUserId,
                expiryDate: expiry,
                isSystemRole: false,
            })
            .returning();

        if (!newRole) {
            return res.status(500).json({
                message: 'Failed to create a new role',
                status: 500
            });
        }


        // Assign the permissions to the specific role that you got created
        const assignPermissions = await db.transaction(
            async (tx) => {
                return await tx.insert(rolePermissionTable)
                    .values(
                        uniquePermissions?.map((permissionId: number) => ({
                            roleId: newRole.id,
                            permissionId: permissionId
                        }))
                    )
                    .returning();
            });

        // Assign the role to the user in userRoles table
        const assignRoleToUser = await db
            .update(userRoleTable)
            .set({
                roleId: newRole?.id
            })
            .where(eq(userRoleTable.userId, userId)).returning();

        if (!assignRoleToUser) {
            return res.status(400).json({
                message: 'Failed to assign role to the user',
                status: 400
            });
        }

        res.status(201).json({
            message: "Permissions assigned successfully",
            roleId: newRole.id,
            userId: userId,
            permissionsCount: assignPermissions.length
        });


    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error Assignign Permission', error });
    }
}

const addSpecificPermissionsToRole = async (req: Request, res: Response) => {
    try {
        const { userId, permissions } = req.body;
        const { instituteId, roles } = await getLoggedInUserDetails(req);

        if (!userId || userId.trim() === "") {
            return res.status(400).json({
                message: "Please provide all the required fields",
                status: 400
            })
        }

        if (!Array.isArray(permissions) || permissions.length === 0) {
            return res.status(400).json({
                message: "Please provide permissions that has to be assigned",
                status: 400
            })
        }

        const uniquePermissions: number[] = [...new Set(permissions)];
        const isAllowedToAssignRole = roles.includes('SUPER_ADMIN') || roles.includes('SCHOOL_ADMIN');

        if (!isAllowedToAssignRole) {
            return res.status(401).json({
                message: "Action Denied. You are not allowed to assign any permissions",
                status: 401
            })
        }


        const [existingUser] = await db
            .select()
            .from(usersTable)
            .where(
                and(
                    eq(usersTable.id, userId),
                    eq(usersTable.instituteId, instituteId)
                )
            ).limit(1);

        if (!existingUser) {
            return res.status(404).json({
                message: "User not found",
                status: 404
            })
        }

        // Fetch users role and permissions
        const userRolesWithPermissions = await db.select({
            roleId: rolesTable.id,
            roleName: rolesTable.name,
            permissionId: permissionsTable.id,
            permissionSlug: permissionsTable.slug,
            permissionModule: permissionsTable.module
        }).from(userRoleTable)
            .innerJoin(rolesTable, eq(userRoleTable.roleId, rolesTable.id))
            .innerJoin(rolePermissionTable, eq(rolesTable.id, rolePermissionTable.roleId))
            .innerJoin(permissionsTable, eq(rolePermissionTable.permissionId, permissionsTable.id))
            .where(eq(userRoleTable.userId, userId));

        const roleId = Number(userRolesWithPermissions?.[0]?.roleId);

        // Extract unique permissions (since a user might have multiple roles with overlapping permissions)
        const existingPermissions: number[] = [...new Set(userRolesWithPermissions.map(item => item.permissionId))];

        // find permissions that are NOT already assigned
        const newPermissions = [...uniquePermissions].filter(
            permissionId => !existingPermissions.includes(permissionId)
        );

        if (newPermissions.length === 0) {
            return res.status(200).json({
                message: "These permissions are already assigned",
                status: 200
            });
        }

        // Add new Permissions
        await db.
            transaction(
                async (tx) => {
                    return await tx.insert(rolePermissionTable)
                        .values(
                            newPermissions?.map((permissionId: number) => ({
                                roleId: roleId,
                                permissionId: permissionId
                            }))
                        )
                        .returning();
                });

        return res.status(201).json({
            message: "New permissions assigned successfully",
            addedPermissions: newPermissions,
            status: 201
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error adding permission",
            status: 500
        })
    }
}

const updateRoleName = async (req: Request, res: Response) => {
    try {
        const { roleId, newRoleName } = req.body;
        const { instituteId, roles } = await getLoggedInUserDetails(req);
        if (!roleId || !newRoleName || newRoleName.trim() === "") {
            return res.status(400).json({
                message: "Please provide all the required fields",
                status: 400
            })
        }

        const isAllowedToUpdateRole = roles.includes('SUPER_ADMIN') || roles.includes('SCHOOL_ADMIN');

        if (!isAllowedToUpdateRole) {
            return res.status(401).json({
                message: "Action Denied. You are not allowed to update role names",
                status: 401
            })
        }

        const [existingRole] = await db
            .select()
            .from(rolesTable)
            .where(
                and(
                    eq(rolesTable.id, roleId),
                    eq(rolesTable.instituteId, instituteId)
                )
            ).limit(1);


        if (!existingRole) {
            return res.status(404).json({
                message: "Role not found",
                status: 404
            })
        }

        await db
            .update(rolesTable)
            .set({
                name: newRoleName
            })
            .where(
                and(
                    eq(rolesTable.id, roleId),
                    eq(rolesTable.instituteId, instituteId)
                )
            ).returning();

        return res.status(200).json({
            message: "Role name updated successfully",
            status: 200
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error updating role name",
            status: 500
        })
    }
}

const removeSpecificPermissionsFromRole = async (req: Request, res: Response) => {
    try {

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error removing permission",
            status: 500
        })
    }
}

export { assignCustomRole, addSpecificPermissionsToRole, updateRoleName, removeSpecificPermissionsFromRole }