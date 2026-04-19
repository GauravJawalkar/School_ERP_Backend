CREATE TYPE "public"."medium" AS ENUM('ENGLISH', 'HINDI', 'MARATHI', 'GUJARATI', 'BENGALI', 'TAMIL', 'TELGU', 'KANNADA', 'URDU', 'PUNJABI', 'OTHER');--> statement-breakpoint
ALTER TABLE "instituteProfileTable" ADD COLUMN "medium" "medium";--> statement-breakpoint
ALTER TABLE "instituteProfileTable" ADD COLUMN "additionalInfo" jsonb;