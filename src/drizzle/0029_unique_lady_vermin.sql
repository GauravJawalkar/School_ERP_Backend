ALTER TABLE "userRoleTable" DROP CONSTRAINT "userRoleTable_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "userRoleTable" DROP CONSTRAINT "userRoleTable_roleId_rolesTable_id_fk";
--> statement-breakpoint
ALTER TABLE "userRoleTable" DROP CONSTRAINT "userRoleTable_assignedBy_users_id_fk";
--> statement-breakpoint
ALTER TABLE "subjectAllocationsTable" ADD COLUMN "classId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "userRoleTable" ADD CONSTRAINT "userRoleTable_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userRoleTable" ADD CONSTRAINT "userRoleTable_roleId_rolesTable_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."rolesTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userRoleTable" ADD CONSTRAINT "userRoleTable_assignedBy_users_id_fk" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjectAllocationsTable" ADD CONSTRAINT "subjectAllocationsTable_classId_classesTable_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classesTable"("id") ON DELETE cascade ON UPDATE no action;