ALTER TYPE "public"."applicationStatus" ADD VALUE 'INQUIRY';--> statement-breakpoint
ALTER TABLE "admissionsTable" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admissionsTable" DROP COLUMN "lastAdmissionNo";