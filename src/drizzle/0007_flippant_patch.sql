CREATE TYPE "public"."enrollmentStatus" AS ENUM('ACTIVE', 'COMPLETED', 'TRANSFERRED', 'WITHDRAWN');--> statement-breakpoint
CREATE TABLE "studentEnrollmentTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "studentEnrollmentTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"studentId" integer NOT NULL,
	"classId" integer NOT NULL,
	"sectionId" integer,
	"academicYearId" integer NOT NULL,
	"rollNo" integer,
	"enrollmentDate" date NOT NULL,
	"status" "enrollmentStatus" DEFAULT 'ACTIVE' NOT NULL,
	"exitDate" date,
	"exitReason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studentEnrollmentTable" ADD CONSTRAINT "studentEnrollmentTable_studentId_studentsTable_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."studentsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentEnrollmentTable" ADD CONSTRAINT "studentEnrollmentTable_classId_classesTable_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classesTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentEnrollmentTable" ADD CONSTRAINT "studentEnrollmentTable_sectionId_sectionsTable_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."sectionsTable"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentEnrollmentTable" ADD CONSTRAINT "studentEnrollmentTable_academicYearId_academicYearsTable_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYearsTable"("id") ON DELETE cascade ON UPDATE no action;