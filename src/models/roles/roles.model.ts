import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const rolesTable = pgTable("rolesTable", {
    id: serial('id').primaryKey().notNull(),
    name: text('name').notNull().unique(),
    instituteId: integer('instituteId').notNull(), //TODO: Add foreign key reference to institutes table
    description: text('description'),
    isSystemRole: boolean('isSystemRole').notNull().default(false),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
})