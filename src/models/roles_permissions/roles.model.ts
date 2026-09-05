import { boolean, date, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { instituteProfileTable } from '../institute/instituteProfile.model'

export const rolesTable = pgTable("rolesTable", {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: text('name').notNull(),
    instituteId: integer('instituteId').references(() => instituteProfileTable.id),
    description: text('description'),
    isSystemRole: boolean('isSystemRole').notNull().default(false),
    expiryDate: date('expiryDate', { mode: 'date' }),
    createdBy: uuid('createdBy'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').$onUpdate(() => new Date())
}, (table) => [
    unique("institute_role_name_unique").on(table.instituteId, table.name).nullsNotDistinct()
])