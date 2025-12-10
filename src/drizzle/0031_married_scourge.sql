ALTER TABLE "subjectAllocationsTable" DROP CONSTRAINT "subjectAllocationsTable_subjectId_subjectsTable_id_fk";
--> statement-breakpoint
ALTER TABLE "subjectAllocationsTable" ADD CONSTRAINT "subjectAllocationsTable_subjectId_classSubjectsTable_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."classSubjectsTable"("id") ON DELETE cascade ON UPDATE no action;