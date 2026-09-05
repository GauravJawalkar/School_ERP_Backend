import { db } from "../db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function runMigration() {
    try {
        console.log("Running migration 0005_complex_vulcan.sql...");
        const sqlFilePath = path.join(__dirname, "../drizzle/0005_complex_vulcan.sql");
        const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

        // Split statements by --> statement-breakpoint
        const statements = sqlContent
            .split("--> statement-breakpoint")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        for (const statement of statements) {
            console.log("Executing:", statement.slice(0, 80) + "...");
            await db.execute(sql.raw(statement));
        }

        console.log("✅ Migration 0005 executed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

runMigration();
