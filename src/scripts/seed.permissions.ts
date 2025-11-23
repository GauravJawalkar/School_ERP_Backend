
import { db } from "../db";
import { permissionsTable } from "../models";
import { ALL_PERMISSIONS } from "../config/permissions";


//   Seeds all permissions into the database
//   Run once: npm run seed

async function seedPermissions() {
    console.log("🌱 Seeding permissions...");

    try {
        for (const slug of ALL_PERMISSIONS) {
            const [moduleName = "", action = ""] = slug.split(".");

            const capitalizedModule =
                moduleName ? moduleName.charAt(0).toUpperCase() + moduleName.slice(1) : "";

            await db
                .insert(permissionsTable)
                .values({
                    slug,
                    module: capitalizedModule,
                    description: `Permission to ${action || ""} ${moduleName || ""}`,
                })
                .onConflictDoNothing();
        }

        console.log(`✅ Seeded ${ALL_PERMISSIONS.length} permissions`);
    } catch (error) {
        console.error("❌ Seed failed:", error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    seedPermissions()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export { seedPermissions };