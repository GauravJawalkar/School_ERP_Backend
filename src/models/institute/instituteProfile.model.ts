import { pgTable, varchar, integer, timestamp, json } from "drizzle-orm/pg-core";
import type { ContactInfo } from "../../interface";

export const instituteProfileTable = pgTable('instituteProfileTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    schoolName: varchar("schoolName", { length: 255 }).notNull().unique(),
    affiliationNumber: varchar("affiliationNumber").notNull().unique(),
    address: varchar("address").notNull(),
    logoUrl: varchar("logo"),
    contactInfo: json("contactInfo").$type<ContactInfo>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull()
})