ALTER TABLE "rolePermissionTable" DROP CONSTRAINT "rolePermissionTable_id_unique";--> statement-breakpoint
ALTER TABLE "rolesTable" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "rolesTable" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "rolesTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "permissionsTable" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "permissionsTable" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "permissionsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "rolePermissionTable" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "rolePermissionTable" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "rolePermissionTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "rolePermissionTable" ALTER COLUMN "roleId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "instituteProfileTable" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "instituteProfileTable" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "instituteProfileTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "academicYearsTable" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "academicYearsTable" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "academicYearsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);