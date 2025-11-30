CREATE TABLE "teacherProfileTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "teacherProfileTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"staffId" integer NOT NULL,
	"qualification" jsonb,
	"majorSubjects" jsonb,
	"weeklyWorkloadLimit" jsonb,
	"isClassTeacher" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "teacherProfileTable" ADD CONSTRAINT "teacherProfileTable_staffId_staffTable_id_fk" FOREIGN KEY ("staffId") REFERENCES "public"."staffTable"("id") ON DELETE no action ON UPDATE no action;