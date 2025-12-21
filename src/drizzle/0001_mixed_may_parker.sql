CREATE TYPE "public"."occupation" AS ENUM('BUSINESS', 'JOB', 'HOUSE_WIFE');--> statement-breakpoint
CREATE TYPE "public"."primaryContact" AS ENUM('FATHER', 'MOTHER', 'GUARDIAN');--> statement-breakpoint
ALTER TABLE "parentsTable" RENAME COLUMN "userId" TO "studentId";--> statement-breakpoint
ALTER TABLE "parentsTable" DROP CONSTRAINT "parentsTable_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "parentsTable" ALTER COLUMN "address" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "studentsTable" ALTER COLUMN "userId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "instituteId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "fatherOccupation" "occupation";--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "fatherQualification" varchar(100);--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "fatherPhone" varchar(15);--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "fatherEmail" varchar(100);--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "fatherAadhar" varchar(12);--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "motherOccupation" "occupation";--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "motherPhone" varchar(15);--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "motherEmail" varchar(100);--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "motherAadhar" varchar(12);--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "guardianName" varchar(100);--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "guardianRelation" varchar(50);--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "guardianPhone" varchar(15);--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "guardianEmail" varchar(100);--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "guardianOccupation" varchar(100);--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "primaryContactPerson" "primaryContact";--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "primaryPhone" varchar(15) NOT NULL;--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "state" varchar(100);--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "pincode" varchar(10);--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "parentsTable" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "parentsTable" ADD CONSTRAINT "parentsTable_studentId_studentsTable_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."studentsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parentsTable" ADD CONSTRAINT "parentsTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parentsTable" DROP COLUMN "fatherContactNo";--> statement-breakpoint
ALTER TABLE "parentsTable" DROP COLUMN "motherContactNo";--> statement-breakpoint
ALTER TABLE "parentsTable" DROP COLUMN "email";