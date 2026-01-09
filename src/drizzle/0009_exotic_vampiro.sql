ALTER TABLE "rolesTable" ADD COLUMN "expiryDate" date;--> statement-breakpoint
ALTER TABLE "rolesTable" ADD COLUMN "createdBy" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "rolesTable" ADD COLUMN "updatedAt" timestamp;--> statement-breakpoint
ALTER TABLE "instituteProfileTable" ADD COLUMN "status" "status" DEFAULT 'ACTIVE' NOT NULL;