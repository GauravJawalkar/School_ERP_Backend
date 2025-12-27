ALTER TABLE "admissionsTable" ADD COLUMN "isDeleted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "admissionsTable" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "admissionsTable" ADD COLUMN "deletedBy" uuid;--> statement-breakpoint
ALTER TABLE "admissionsTable" ADD COLUMN "deletionReason" text;--> statement-breakpoint
ALTER TABLE "admissionsTable" ADD CONSTRAINT "admissionsTable_deletedBy_users_id_fk" FOREIGN KEY ("deletedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;