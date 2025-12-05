ALTER TABLE "studentsTable" DROP CONSTRAINT "studentsTable_instituteId_users_instituteId_fk";
--> statement-breakpoint
ALTER TABLE "studentsTable" ADD CONSTRAINT "studentsTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;