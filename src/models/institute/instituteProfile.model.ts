import { pgTable, varchar, integer, timestamp, json, jsonb } from "drizzle-orm/pg-core";
import type { ContactInfo } from "../../interface";

export const instituteProfileTable = pgTable('instituteProfileTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    schoolName: varchar("schoolName", { length: 255 }).notNull().unique(),
    affiliationNumber: varchar("affiliationNumber").notNull().unique(),
    address: varchar("address").notNull(),
    logoUrl: varchar("logo"),
    contactInfo: jsonb("contactInfo").$type<ContactInfo>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull()
})