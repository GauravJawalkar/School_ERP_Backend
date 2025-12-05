ALTER TABLE "studentEnrollmentTable" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "studentEnrollmentTable" CASCADE;--> statement-breakpoint
ALTER TABLE "studentsTable" ALTER COLUMN "rollNo" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "studentsTable" ADD COLUMN "instituteId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "studentsTable" ADD CONSTRAINT "studentsTable_instituteId_users_instituteId_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."users"("instituteId") ON DELETE cascade ON UPDATE no action;