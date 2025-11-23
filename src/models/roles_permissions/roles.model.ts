import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { instituteProfileTable } from '../institute/instituteProfile.model'

export const rolesTable = pgTable("rolesTable", {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: text('name').notNull().unique(),
    instituteId: integer('instituteId').notNull().references(() => instituteProfileTable.id),
    description: text('description'),
    isSystemRole: boolean('isSystemRole').notNull().default(false),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
})