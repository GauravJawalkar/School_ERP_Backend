ALTER TABLE "userRoleTable" ALTER COLUMN "assignedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "userRoleTable" ALTER COLUMN "assignedBy" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role";--> statement-breakpoint
DROP TYPE "public"."user_role";