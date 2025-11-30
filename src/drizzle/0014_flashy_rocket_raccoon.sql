CREATE TYPE "public"."category" AS ENUM('GENERAL', 'OBC', 'SC/ST');--> statement-breakpoint
CREATE TABLE "studentAttendance" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "studentAttendance_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"studentId" integer NOT NULL,
	"status" "status" NOT NULL,
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "studentDocumentsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "studentDocumentsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"studentId" integer NOT NULL,
	"documentType" varchar(50) NOT NULL,
	"documentName" varchar(100) NOT NULL,
	"document_url" text NOT NULL,
	"isVerified" boolean DEFAULT false,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studentEnrollmentTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "studentEnrollmentTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"studentId" integer NOT NULL,
	"classId" integer NOT NULL,
	"sectionId" integer NOT NULL,
	"academicYearId" integer NOT NULL,
	"rollNo" varchar(20),
	"enrollmentDate" date NOT NULL,
	"status" "status" DEFAULT 'ACTIVE' NOT NULL,
	"exitDate" date,
	"exitReason" varchar(400),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studentsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "studentsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"addmissionNo" integer,
	"userId" uuid,
	"firstName" varchar(50) NOT NULL,
	"lastName" varchar(50) NOT NULL,
	"DOB" date NOT NULL,
	"gender" "gender" NOT NULL,
	"currentClassId" integer NOT NULL,
	"currentSectionId" integer NOT NULL,
	"category" "category",
	"status" "status" NOT NULL,
	"rollNo" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "staffAttendanceTable" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "studentAttendance" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "studentEnrollmentTable" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "studentEnrollmentTable" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::text;--> statement-breakpoint
ALTER TABLE "studentsTable" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."status";--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('ACTIVE', 'ALUMINI', 'WITHDRAWN', 'TRANSFRRED');--> statement-breakpoint
ALTER TABLE "staffAttendanceTable" ALTER COLUMN "status" SET DATA TYPE "public"."status" USING "status"::"public"."status";--> statement-breakpoint
ALTER TABLE "studentAttendance" ALTER COLUMN "status" SET DATA TYPE "public"."status" USING "status"::"public"."status";--> statement-breakpoint
ALTER TABLE "studentEnrollmentTable" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"public"."status";--> statement-breakpoint
ALTER TABLE "studentEnrollmentTable" ALTER COLUMN "status" SET DATA TYPE "public"."status" USING "status"::"public"."status";--> statement-breakpoint
ALTER TABLE "studentsTable" ALTER COLUMN "status" SET DATA TYPE "public"."status" USING "status"::"public"."status";--> statement-breakpoint
ALTER TABLE "studentAttendance" ADD CONSTRAINT "studentAttendance_studentId_studentsTable_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."studentsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentDocumentsTable" ADD CONSTRAINT "studentDocumentsTable_studentId_studentsTable_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."studentsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentEnrollmentTable" ADD CONSTRAINT "studentEnrollmentTable_studentId_studentsTable_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."studentsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentEnrollmentTable" ADD CONSTRAINT "studentEnrollmentTable_classId_classesTable_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classesTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentEnrollmentTable" ADD CONSTRAINT "studentEnrollmentTable_sectionId_sectionsTable_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."sectionsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentEnrollmentTable" ADD CONSTRAINT "studentEnrollmentTable_academicYearId_academicYearsTable_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYearsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentsTable" ADD CONSTRAINT "studentsTable_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentsTable" ADD CONSTRAINT "studentsTable_currentClassId_classesTable_id_fk" FOREIGN KEY ("currentClassId") REFERENCES "public"."classesTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentsTable" ADD CONSTRAINT "studentsTable_currentSectionId_sectionsTable_id_fk" FOREIGN KEY ("currentSectionId") REFERENCES "public"."sectionsTable"("id") ON DELETE no action ON UPDATE no action;