CREATE TYPE "public"."classSectionName" AS ENUM('A', 'B', 'C', 'D', 'E', 'F');--> statement-breakpoint
CREATE TYPE "public"."daysOfWeek" AS ENUM('1', '2', '3', '4', '5', '6', '7');--> statement-breakpoint
CREATE TYPE "public"."subjectType" AS ENUM('THEORY', 'PRACTICAL', 'LAB');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE', 'HOLIDAY');--> statement-breakpoint
CREATE TABLE "classesTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "classesTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"instituteId" integer NOT NULL,
	"className" varchar(50) NOT NULL,
	"orderIndex" integer NOT NULL,
	"academicYearId" integer NOT NULL,
	"capacity" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sectionsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sectionsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" "classSectionName" NOT NULL,
	"classId" integer,
	"classTeacherId" integer,
	"roomNumber" varchar(20),
	"capacity" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjectAllocationsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subjectAllocationsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"academicYearId" integer NOT NULL,
	"sectionId" integer NOT NULL,
	"subjectId" integer NOT NULL,
	"teacherId" integer
);
--> statement-breakpoint
CREATE TABLE "subjectsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subjectsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"instituteId" integer,
	"name" varchar(50) NOT NULL,
	"code" varchar(20),
	"type" "subjectType" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeTableSlotsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timeTableSlotsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sectionId" integer NOT NULL,
	"dayOfWeek" "daysOfWeek" NOT NULL,
	"startTime" varchar(10) NOT NULL,
	"endTime" varchar(10) NOT NULL,
	"subjectAllocationId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staffAttendanceTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "staffAttendanceTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"staffId" integer NOT NULL,
	"date" date NOT NULL,
	"checkInTime" time NOT NULL,
	"checkOutTime" time,
	"status" "status" NOT NULL,
	"biometricDeviceId" varchar(100)
);
--> statement-breakpoint
ALTER TABLE "classesTable" ADD CONSTRAINT "classesTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classesTable" ADD CONSTRAINT "classesTable_academicYearId_academicYearsTable_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYearsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectionsTable" ADD CONSTRAINT "sectionsTable_classId_classesTable_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classesTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectionsTable" ADD CONSTRAINT "sectionsTable_classTeacherId_staffTable_id_fk" FOREIGN KEY ("classTeacherId") REFERENCES "public"."staffTable"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjectAllocationsTable" ADD CONSTRAINT "subjectAllocationsTable_academicYearId_academicYearsTable_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYearsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjectAllocationsTable" ADD CONSTRAINT "subjectAllocationsTable_sectionId_sectionsTable_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."sectionsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjectAllocationsTable" ADD CONSTRAINT "subjectAllocationsTable_subjectId_subjectsTable_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subjectsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjectAllocationsTable" ADD CONSTRAINT "subjectAllocationsTable_teacherId_staffTable_id_fk" FOREIGN KEY ("teacherId") REFERENCES "public"."staffTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjectsTable" ADD CONSTRAINT "subjectsTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeTableSlotsTable" ADD CONSTRAINT "timeTableSlotsTable_sectionId_sectionsTable_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."sectionsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeTableSlotsTable" ADD CONSTRAINT "timeTableSlotsTable_subjectAllocationId_subjectAllocationsTable_id_fk" FOREIGN KEY ("subjectAllocationId") REFERENCES "public"."subjectAllocationsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffAttendanceTable" ADD CONSTRAINT "staffAttendanceTable_staffId_staffTable_id_fk" FOREIGN KEY ("staffId") REFERENCES "public"."staffTable"("id") ON DELETE no action ON UPDATE no action;