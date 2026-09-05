ALTER TABLE "rolesTable" DROP CONSTRAINT "rolesTable_name_unique";--> statement-breakpoint
ALTER TABLE "rolePermissionTable" DROP CONSTRAINT "rolePermissionTable_roleId_rolesTable_id_fk";
--> statement-breakpoint
ALTER TABLE "rolePermissionTable" DROP CONSTRAINT "rolePermissionTable_permissionId_permissionsTable_id_fk";
--> statement-breakpoint
ALTER TABLE "rolesTable" ALTER COLUMN "instituteId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "rolePermissionTable" ADD CONSTRAINT "rolePermissionTable_roleId_rolesTable_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."rolesTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolePermissionTable" ADD CONSTRAINT "rolePermissionTable_permissionId_permissionsTable_id_fk" FOREIGN KEY ("permissionId") REFERENCES "public"."permissionsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userRoleTable" ADD CONSTRAINT "user_role_unique" UNIQUE("userId","roleId");--> statement-breakpoint
ALTER TABLE "rolesTable" ADD CONSTRAINT "institute_role_name_unique" UNIQUE NULLS NOT DISTINCT("instituteId","name");--> statement-breakpoint
ALTER TABLE "rolePermissionTable" ADD CONSTRAINT "role_permission_unique" UNIQUE("roleId","permissionId");