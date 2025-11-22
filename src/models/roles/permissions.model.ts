import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const permissionsTable = pgTable("permissionsTable", {
    id: serial('id').primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    module: varchar("module", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
})