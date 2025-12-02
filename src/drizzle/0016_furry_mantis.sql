CREATE TYPE "public"."applicationStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "admissionsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admissionsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"academicYearId" integer NOT NULL,
	"admissionDate" date NOT NULL,
	"lastAdmissionNo" integer NOT NULL,
	"instituteId" integer NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"board" varchar(100) NOT NULL,
	"parentPhoneNo" varchar(15) NOT NULL,
	"status" "applicationStatus" DEFAULT 'PENDING' NOT NULL,
	"classId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admissionsTable" ADD CONSTRAINT "admissionsTable_academicYearId_academicYearsTable_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYearsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissionsTable" ADD CONSTRAINT "admissionsTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissionsTable" ADD CONSTRAINT "admissionsTable_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissionsTable" ADD CONSTRAINT "admissionsTable_classId_classesTable_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classesTable"("id") ON DELETE cascade ON UPDATE no action;