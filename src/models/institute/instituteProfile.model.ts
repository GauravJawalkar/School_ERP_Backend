import { pgTable, varchar, integer, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import type { ContactInfo, InstituteAdditionalInfo } from "../../interface";

export const instituteStatusEnumm = pgEnum('instituteStatus', ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL']);
export const instituteMediumEnum = pgEnum('medium', ['ENGLISH', 'HINDI', 'MARATHI', 'GUJARATI', 'BENGALI', 'TAMIL', 'TELGU', 'KANNADA', 'URDU', 'PUNJABI', 'OTHER']);

export const instituteProfileTable = pgTable('instituteProfileTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    schoolName: varchar("schoolName", { length: 255 }).notNull().unique(),
    slug: varchar('slug', { length: 255 }).unique().notNull(),
    affiliationNumber: varchar("affiliationNumber").notNull().unique(),
    status: instituteStatusEnumm('status').default('ACTIVE').notNull(),
    address: varchar("address").notNull(),
    logoUrl: varchar("logo"),
    medium: instituteMediumEnum('medium'),
    contactInfo: jsonb("contactInfo").$type<ContactInfo>(),
    additionalInfo: jsonb("additionalInfo").$type<InstituteAdditionalInfo>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull()
})