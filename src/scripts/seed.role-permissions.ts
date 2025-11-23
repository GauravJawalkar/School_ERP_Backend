// src/scripts/seed-role-permissions.ts

import { db } from "../db";
import { rolesTable, permissionsTable, rolePermissionTable } from "../models";
import { ROLE_PERMISSIONS } from "../config/permissions";
import { eq, inArray } from "drizzle-orm";

/**
 * Seeds the role-permission mappings
 * This connects roles to their permissions
 * 
 * Run: npm run seed:role-permissions
 */
async function seedRolePermissions() {
    console.log("🔗 Seeding role-permission mappings...");

    try {
        // Get all roles from database
        const allRoles = await db.select().from(rolesTable);

        for (const role of allRoles) {
            console.log(`\n📋 Processing role: ${role.name}`);

            // Get permission slugs for this role from config
            const permissionSlugs = ROLE_PERMISSIONS[role.name as keyof typeof ROLE_PERMISSIONS];

            if (!permissionSlugs || permissionSlugs.length === 0) {
                console.log(`  ⚠️  No permissions defined for ${role.name}`);
                continue;
            }

            // Get permission IDs from database
            const permissions = await db
                .select({ id: permissionsTable.id, slug: permissionsTable.slug })
                .from(permissionsTable)
                .where(inArray(permissionsTable.slug, permissionSlugs));

            if (permissions.length === 0) {
                console.log(`  ⚠️  No permissions found in database for ${role.name}`);
                continue;
            }

            // Delete existing mappings for this role (fresh start)
            await db.delete(rolePermissionTable).where(eq(rolePermissionTable.roleId, role.id));

            // Create new mappings
            const mappings = permissions.map((perm) => ({
                roleId: role.id,
                permissionId: perm.id,
            }));

            await db.insert(rolePermissionTable).values(mappings);

            console.log(`  ✅ Assigned ${permissions.length} permissions to ${role.name}`);
        }

        console.log("\n✅ Role-permission seeding completed!");
    } catch (error) {
        console.error("❌ Role-permission seeding failed:", error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    seedRolePermissions()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export { seedRolePermissions };