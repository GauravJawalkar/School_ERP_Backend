ALTER TABLE "parentsTable" ALTER COLUMN "updatedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "parentsTable" ALTER COLUMN "updatedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admissionsTable" ALTER COLUMN "updatedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "admissionsTable" ALTER COLUMN "updatedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "classSubjectsTable" ALTER COLUMN "updatedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "classSubjectsTable" ALTER COLUMN "updatedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "studentEnrollmentTable" ALTER COLUMN "updatedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "studentEnrollmentTable" ALTER COLUMN "updatedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "feeHeadsTable" ALTER COLUMN "updatedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "feeHeadsTable" ALTER COLUMN "updatedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "feeInstallmentsTable" ALTER COLUMN "updatedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "feeInstallmentsTable" ALTER COLUMN "updatedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "feeStructuresTable" ALTER COLUMN "updatedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "feeStructuresTable" ALTER COLUMN "updatedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invoicesTable" ALTER COLUMN "updatedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "invoicesTable" ALTER COLUMN "updatedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "studentFeeAssignmentsTable" ALTER COLUMN "updatedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "studentFeeAssignmentsTable" ALTER COLUMN "updatedAt" DROP NOT NULL;