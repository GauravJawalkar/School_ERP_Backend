import type { Request, Response } from "express";
import type { TokenUser } from "../interface";
import { db } from "../db";
import { instituteProfileTable, rolePermissionTable, rolesTable, userRoleTable, usersTable } from "../models";
import { and, eq } from "drizzle-orm";


// STEPS: Permissions are totally based on the roles so need to figure out a way where i can assign specific permisssions
// 1. Create a custom role (instituteLevel which is not a systemRole)
// 2. Then get all the permissions that you need for this specific user
// 3. Check of he/she is not getting the any critical permission that are critical
// 4. Create the role and then assign permissions to the user 

//TODO
// 1. The role must have an expiry like after some time or a specific time it will get expired and then the user cannot just have the permissions
// 2. If i try to asign new Role to the same user again what should be the flow ? Need to figure it out

const assignCustomRole = async (req: Request, res: Response) => {
    try {

        const { userId, permissions, roleName, expiryDate } = req.body;
        const loggedInUser = req.user as TokenUser;
        const instituteId = Number(loggedInUser?.instituteId);
        const loggedInUserRoles = loggedInUser?.roles;

        // Double check after the checkUserRole Middleware
        const isAllowedToAssignRole = loggedInUserRoles.includes('SUPER_ADMIN') || loggedInUserRoles.includes('SCHOOL_ADMIN');

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
                createdBy: loggedInUser?.id,
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

export { assignCustomRole };