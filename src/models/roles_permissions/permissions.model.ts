import { pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";

export const permissionsTable = pgTable("permissionsTable", {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    module: varchar("module", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
})