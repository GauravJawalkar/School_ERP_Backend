import { boolean, date, integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { instituteProfileTable } from "../institute/instituteProfile.model";

export const academicYearsTable = pgTable('academicYearsTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    instituteId: integer('instituteId').notNull().references(() => instituteProfileTable.id),
    name: varchar('name').notNull(),
    startDate: date('startDate').notNull(),
    endDate: date('endDate').notNull(),
    isActive: boolean('isActiveYear').notNull(),
})