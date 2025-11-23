import { db } from "../db";
import { rolesTable } from "../models"; // Assuming 'rolesTable' is the correct export name

// 1. Define your standard roles list matching your Enums/Config
const ROLES_LIST = [
    { name: "SUPER_ADMIN", description: "SaaS Owner. Full system access." },
    { name: "SCHOOL_ADMIN", description: "School Principal/Owner. Manages one school." },
    { name: "TEACHER", description: "Classroom access, marks, attendance." },
    { name: "ACCOUNTANT", description: "Fee collection and financial reports." },
    { name: "LIBRARIAN", description: "Library inventory and book issues." },
    { name: "RECEPTIONIST", description: "Front desk, visitor logs, admissions." },
    { name: "TRANSPORT_MANAGER", description: "Bus routes and driver management." },
    { name: "STUDENT", description: "Read-only access to own data." },
    { name: "PARENT", description: "Read-only access to child data + Fee payments." },
];

async function seedRolesOptimized() {
    console.log("Seeding Roles (Optimized)...");

    // Convert the role list into the values needed for the bulk insert
    // NOTE: 'instituteId' is required by the table type, so provide a default here
    //       (adjust the value as appropriate for your environment).
    const valuesToInsert = ROLES_LIST.map(role => ({
        name: role.name,
        description: role.description,
        isSystemRole: true,
        instituteId: 1, // set the correct institute id for your seeding context
        createdAt: new Date(),
    }));

    // Perform a single bulk insert with conflict handling
    const insertedRoles = await db.insert(rolesTable)
        .values(valuesToInsert)
        // CRITICAL: If a row conflicts on the 'name' column (which should be unique), do nothing.
        // This makes the whole process idempotent and fast.
        .onConflictDoNothing({ target: rolesTable.name })
        .returning({ name: rolesTable.name }); // Return the name of any newly inserted roles

    if (insertedRoles.length > 0) {
        console.log(`Created ${insertedRoles.length} NEW Role(s): ${insertedRoles.map(r => r.name).join(', ')}`);
    } else {
        console.log("All roles already exist in the database. Skipped insertion.");
    }

    console.log("Roles seeding complete!");
    process.exit();
}

seedRolesOptimized().catch(err => {
    console.error("Role seeding failed:", err);
    process.exit(1);
});