import { pgTable, varchar, date, integer, uuid, numeric, jsonb, boolean, time, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "../user/users.model";
import { instituteProfileTable } from "../institute/instituteProfile.model";

export const attendanceStatusEnum = pgEnum('status', ['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE', 'HOLIDAY']);

export const staffTable = pgTable('staffTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    userId: uuid('userId').references(() => usersTable.id).notNull(),
    employeeCode: varchar('employeeCode', { length: 50 }).notNull(),
    firstName: varchar('firstName', { length: 100 }).notNull(),
    lastName: varchar('lastName', { length: 100 }).notNull(),
    designation: varchar('designation', { length: 100 }).notNull(),
    department: varchar('department'),
    joiningDate: date('joiningDate').notNull(),
    salaryBasic: numeric('salaryBasic', { precision: 10, scale: 2 }).notNull(),
    bankDetails: jsonb('bankDetails').notNull()
})

export const teacherProfileTable = pgTable("teacherProfileTable", {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    staffId: integer('staffId').references(() => staffTable.id).notNull(),
    instituteId: integer('instituteId').references(() => instituteProfileTable.id, { onDelete: 'cascade' }).notNull(),
    qualification: jsonb('qualification'),
    majorSubjects: jsonb('majorSubjects'),
    weeklyWorkloadLimit: jsonb('weeklyWorkloadLimit'),
    isClassTeacher: boolean('isClassTeacher').default(false)
})

export const staffAttendanceTable = pgTable('staffAttendanceTable', {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    staffId: integer('staffId').references(() => staffTable.id).notNull(),
    date: date('date').notNull(),
    checkInTime: time('checkInTime').notNull(),
    checkOutTime: time('checkOutTime'),
    status: attendanceStatusEnum('status').notNull(),
    biometricDeviceId: varchar('biometricDeviceId', { length: 100 }),
}) 