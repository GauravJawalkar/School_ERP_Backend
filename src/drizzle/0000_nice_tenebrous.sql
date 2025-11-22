CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'LIBRARIAN', 'RECEPTIONIST', 'TRANSPORT_MANAGER', 'STUDENT', 'PARENT');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firstname" varchar(255) NOT NULL,
	"lastname" varchar(255) NOT NULL,
	"instituteId" integer NOT NULL,
	"profileImage" varchar,
	"email" varchar(255) NOT NULL,
	"phone" varchar(10) NOT NULL,
	"gender" "gender" NOT NULL,
	"password" varchar NOT NULL,
	"role" "user_role" DEFAULT 'STUDENT' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "userRoleTable" (
	"roleId" integer NOT NULL,
	"userId" uuid NOT NULL,
	"assignedAt" timestamp DEFAULT now() NOT NULL,
	"assignedBy" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "userRoleTable" ADD CONSTRAINT "userRoleTable_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userRoleTable" ADD CONSTRAINT "userRoleTable_roleId_rolesTable_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."rolesTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userRoleTable" ADD CONSTRAINT "userRoleTable_assignedBy_users_id_fk" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;