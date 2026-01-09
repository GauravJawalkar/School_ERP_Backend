import { boolean, date, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { instituteProfileTable } from '../institute/instituteProfile.model'

export const rolesTable = pgTable("rolesTable", {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: text('name').notNull().unique(),
    instituteId: integer('instituteId').notNull().references(() => instituteProfileTable.id),
    description: text('description'),
    isSystemRole: boolean('isSystemRole').notNull().default(false),
    expiryDate: date('expiryDate', { mode: 'date' }),
    createdBy: uuid('createdBy').notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').$onUpdate(() => new Date())
})