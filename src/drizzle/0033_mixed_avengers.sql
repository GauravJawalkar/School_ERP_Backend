CREATE TYPE "public"."feeFrequency" AS ENUM('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUALLY');--> statement-breakpoint
CREATE TYPE "public"."feeName" AS ENUM('ACADEMIC', 'TRANSPORT', 'LIBRARY', 'EXAM', 'OTHER');--> statement-breakpoint
CREATE TABLE "feeHeadsTable " (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "feeHeadsTable _id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"instituteId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"ledgerName" varchar(100),
	"feeType" "feeName" NOT NULL,
	"taxPercentage" numeric(5, 2) DEFAULT '0.00',
	"isRefundable" boolean DEFAULT false,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feeInstallmentsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "feeInstallmentsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"academicYearId" integer NOT NULL,
	"instituteId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"installmentNumber" integer NOT NULL,
	"dueDate" date NOT NULL,
	"lateFeeStartDate" date,
	"finePerDay" numeric(10, 2) DEFAULT '0.00',
	"maxFine" numeric(10, 2),
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feeStructuresTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "feeStructuresTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"academicYearId" integer NOT NULL,
	"instituteId" integer NOT NULL,
	"classId" integer NOT NULL,
	"feeHeadId" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"frequency" "feeFrequency" NOT NULL,
	"isCompulsory" boolean DEFAULT true,
	"dueDay" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studentFeeAssignmentsTable " (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "studentFeeAssignmentsTable _id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"studentId" integer NOT NULL,
	"instituteId" integer NOT NULL,
	"feeStructureId" integer NOT NULL,
	"customAmount" numeric(10, 2),
	"discountPercentage" numeric(5, 2) DEFAULT '0.00',
	"discountReason" varchar(200),
	"isWaived" boolean DEFAULT false,
	"waivedReason" text,
	"effectiveAmount" numeric(10, 2) NOT NULL,
	"assignedAt" timestamp DEFAULT now() NOT NULL,
	"assignedBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feeHeadsTable " ADD CONSTRAINT "feeHeadsTable _instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeInstallmentsTable" ADD CONSTRAINT "feeInstallmentsTable_academicYearId_academicYearsTable_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYearsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeInstallmentsTable" ADD CONSTRAINT "feeInstallmentsTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeStructuresTable" ADD CONSTRAINT "feeStructuresTable_academicYearId_academicYearsTable_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYearsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeStructuresTable" ADD CONSTRAINT "feeStructuresTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeStructuresTable" ADD CONSTRAINT "feeStructuresTable_classId_classesTable_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classesTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeStructuresTable" ADD CONSTRAINT "feeStructuresTable_feeHeadId_feeHeadsTable _id_fk" FOREIGN KEY ("feeHeadId") REFERENCES "public"."feeHeadsTable "("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentFeeAssignmentsTable " ADD CONSTRAINT "studentFeeAssignmentsTable _studentId_studentsTable_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."studentsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentFeeAssignmentsTable " ADD CONSTRAINT "studentFeeAssignmentsTable _instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentFeeAssignmentsTable " ADD CONSTRAINT "studentFeeAssignmentsTable _feeStructureId_feeStructuresTable_id_fk" FOREIGN KEY ("feeStructureId") REFERENCES "public"."feeStructuresTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentFeeAssignmentsTable " ADD CONSTRAINT "studentFeeAssignmentsTable _assignedBy_users_id_fk" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;