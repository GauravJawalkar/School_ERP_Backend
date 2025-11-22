CREATE TABLE "rolesTable" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"instituteId" integer NOT NULL,
	"description" text,
	"isSystemRole" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rolesTable_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "permissionsTable" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"module" varchar(255) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissionsTable_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "rolePermissionTable" (
	"id" serial PRIMARY KEY NOT NULL,
	"roleId" serial NOT NULL,
	"permissionId" integer NOT NULL,
	CONSTRAINT "rolePermissionTable_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "rolePermissionTable" ADD CONSTRAINT "rolePermissionTable_roleId_rolesTable_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."rolesTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolePermissionTable" ADD CONSTRAINT "rolePermissionTable_permissionId_permissionsTable_id_fk" FOREIGN KEY ("permissionId") REFERENCES "public"."permissionsTable"("id") ON DELETE no action ON UPDATE no action;