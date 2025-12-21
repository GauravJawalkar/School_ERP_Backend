CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."occupation" AS ENUM('BUSINESS', 'JOB', 'HOUSE_WIFE');--> statement-breakpoint
CREATE TYPE "public"."primaryContact" AS ENUM('FATHER', 'MOTHER', 'GUARDIAN');--> statement-breakpoint
CREATE TYPE "public"."relation" AS ENUM('FATHER', 'MOTHER', 'GUARDIAN');--> statement-breakpoint
CREATE TYPE "public"."applicationStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'INQUIRY');--> statement-breakpoint
CREATE TYPE "public"."classSectionName" AS ENUM('A', 'B', 'C', 'D', 'E', 'F');--> statement-breakpoint
CREATE TYPE "public"."daysOfWeek" AS ENUM('1', '2', '3', '4', '5', '6', '7');--> statement-breakpoint
CREATE TYPE "public"."subjectType" AS ENUM('THEORY', 'PRACTICAL', 'LAB');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('ACTIVE', 'ALUMINI', 'WITHDRAWN', 'TRANSFRRED');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('GENERAL', 'OBC', 'SC/ST');--> statement-breakpoint
CREATE TYPE "public"."feeFrequency" AS ENUM('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUALLY');--> statement-breakpoint
CREATE TYPE "public"."feeType" AS ENUM('ACADEMIC', 'TRANSPORT', 'LIBRARY', 'EXAM', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."invoiceStatus" AS ENUM('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."paymentMode" AS ENUM('CASH', 'UPI', 'CHEQUE', 'BANK_TRANSFER', 'CARD', 'ONLINE');--> statement-breakpoint
CREATE TYPE "public"."transactionStatus" AS ENUM('SUCCESS', 'PENDING', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TABLE "parentsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "parentsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"studentId" integer NOT NULL,
	"instituteId" integer NOT NULL,
	"fatherName" varchar(100) NOT NULL,
	"fatherOccupation" "occupation",
	"fatherQualification" varchar(100),
	"fatherPhone" varchar(15),
	"fatherEmail" varchar(100),
	"fatherAadhar" varchar(12),
	"motherName" varchar(100) NOT NULL,
	"motherOccupation" "occupation",
	"motherPhone" varchar(15),
	"motherEmail" varchar(100),
	"motherAadhar" varchar(12),
	"guardianName" varchar(100),
	"guardianRelation" varchar(50),
	"guardianPhone" varchar(15),
	"guardianEmail" varchar(100),
	"guardianOccupation" varchar(100),
	"primaryContactPerson" "primaryContact",
	"primaryPhone" varchar(15) NOT NULL,
	"whatsAppNo" varchar(20),
	"address" text NOT NULL,
	"city" varchar(100),
	"state" varchar(100),
	"pincode" varchar(10),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resetPasswordTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "resetPasswordTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" uuid NOT NULL,
	"otp" varchar NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "studentParentMapTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "studentParentMapTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"studentId" integer NOT NULL,
	"parentId" integer NOT NULL,
	"relationship" "relation" NOT NULL,
	"isEmergencyContact" boolean DEFAULT true
);
--> statement-breakpoint
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
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "userRoleTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "userRoleTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" uuid NOT NULL,
	"roleId" integer NOT NULL,
	"assignedAt" timestamp DEFAULT now(),
	"assignedBy" uuid
);
--> statement-breakpoint
CREATE TABLE "rolesTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "rolesTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"instituteId" integer NOT NULL,
	"description" text,
	"isSystemRole" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rolesTable_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "permissionsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "permissionsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" varchar(255) NOT NULL,
	"module" varchar(255) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissionsTable_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "rolePermissionTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "rolePermissionTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"roleId" integer NOT NULL,
	"permissionId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instituteProfileTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "instituteProfileTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"schoolName" varchar(255) NOT NULL,
	"affiliationNumber" varchar NOT NULL,
	"address" varchar NOT NULL,
	"logo" varchar,
	"contactInfo" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "instituteProfileTable_schoolName_unique" UNIQUE("schoolName"),
	CONSTRAINT "instituteProfileTable_affiliationNumber_unique" UNIQUE("affiliationNumber")
);
--> statement-breakpoint
CREATE TABLE "academicYearsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "academicYearsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"instituteId" integer NOT NULL,
	"name" varchar NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date NOT NULL,
	"isActiveYear" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admissionsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admissionsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"academicYearId" integer NOT NULL,
	"admissionDate" date NOT NULL,
	"instituteId" integer NOT NULL,
	"userId" uuid,
	"name" varchar(100) NOT NULL,
	"board" varchar(100) NOT NULL,
	"parentPhoneNo" varchar(15) NOT NULL,
	"status" "applicationStatus" DEFAULT 'PENDING' NOT NULL,
	"classId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classSubjectsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "classSubjectsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"classId" integer NOT NULL,
	"subjectId" integer NOT NULL,
	"academicYearId" integer NOT NULL,
	"displayName" varchar(100),
	"maxMarks" integer,
	"minPassingMarks" integer,
	"isCompulsory" boolean DEFAULT true,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classesTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "classesTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"instituteId" integer NOT NULL,
	"className" varchar(50) NOT NULL,
	"orderIndex" integer,
	"academicYearId" integer NOT NULL,
	"capacity" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sectionsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sectionsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" "classSectionName" NOT NULL,
	"classId" integer,
	"classTeacherId" integer,
	"roomNumber" varchar(20),
	"capacity" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjectAllocationsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subjectAllocationsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"academicYearId" integer NOT NULL,
	"instituteId" integer NOT NULL,
	"classId" integer NOT NULL,
	"sectionId" integer NOT NULL,
	"subjectId" integer NOT NULL,
	"teacherId" integer
);
--> statement-breakpoint
CREATE TABLE "subjectsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subjectsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"instituteId" integer,
	"name" varchar(50) NOT NULL,
	"code" varchar(20),
	"type" "subjectType" NOT NULL,
	"description" varchar(255),
	"isActive" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeTableSlotsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timeTableSlotsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"classId" integer NOT NULL,
	"sectionId" integer NOT NULL,
	"dayOfWeek" "daysOfWeek" NOT NULL,
	"startTime" varchar(10) NOT NULL,
	"endTime" varchar(10) NOT NULL,
	"subjectAllocationId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staffAttendanceTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "staffAttendanceTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"staffId" integer NOT NULL,
	"date" date NOT NULL,
	"checkInTime" time NOT NULL,
	"checkOutTime" time,
	"status" "status" NOT NULL,
	"biometricDeviceId" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "staffTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "staffTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" uuid NOT NULL,
	"employeeCode" varchar(50) NOT NULL,
	"firstName" varchar(100) NOT NULL,
	"lastName" varchar(100) NOT NULL,
	"designation" varchar(100) NOT NULL,
	"department" varchar,
	"joiningDate" date NOT NULL,
	"salaryBasic" numeric(10, 2) NOT NULL,
	"bankDetails" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacherProfileTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "teacherProfileTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"staffId" integer NOT NULL,
	"instituteId" integer NOT NULL,
	"qualification" jsonb,
	"majorSubjects" jsonb,
	"weeklyWorkloadLimit" jsonb,
	"isClassTeacher" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "studentAttendance" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "studentAttendance_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"studentId" integer NOT NULL,
	"status" "status" NOT NULL,
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "studentDocumentsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "studentDocumentsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"studentId" integer NOT NULL,
	"documentType" varchar(50) NOT NULL,
	"documentName" varchar(100) NOT NULL,
	"document_url" text NOT NULL,
	"isVerified" boolean DEFAULT false,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studentsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "studentsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"instituteId" integer NOT NULL,
	"addmissionNo" integer,
	"userId" uuid NOT NULL,
	"firstName" varchar(50) NOT NULL,
	"lastName" varchar(50) NOT NULL,
	"DOB" date NOT NULL,
	"gender" "gender" NOT NULL,
	"currentClassId" integer NOT NULL,
	"currentSectionId" integer,
	"category" "category",
	"status" "status" NOT NULL,
	"rollNo" integer
);
--> statement-breakpoint
CREATE TABLE "feeHeadsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "feeHeadsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"instituteId" integer NOT NULL,
	"feeName" varchar(100) NOT NULL,
	"description" text,
	"ledgerName" varchar(100),
	"feeType" "feeType" NOT NULL,
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
	"installmentName" varchar(100) NOT NULL,
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
CREATE TABLE "invoiceLineItemsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invoiceLineItemsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"invoiceId" integer NOT NULL,
	"feeHeadId" integer NOT NULL,
	"description" varchar(200),
	"amount" numeric(10, 2) NOT NULL,
	"taxPercentage" numeric(5, 2) DEFAULT '0.00',
	"taxAmount" numeric(10, 2) DEFAULT '0.00',
	"totalAmount" numeric(10, 2) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoicesTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invoicesTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"invoiceNo" varchar(50) NOT NULL,
	"instituteId" integer NOT NULL,
	"studentId" integer NOT NULL,
	"installmentId" integer NOT NULL,
	"academicYearId" integer NOT NULL,
	"totalAmount" numeric(10, 2) NOT NULL,
	"paidAmount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"balanceAmount" numeric(10, 2) NOT NULL,
	"lateFine" numeric(10, 2) DEFAULT '0.00',
	"status" "invoiceStatus" DEFAULT 'UNPAID' NOT NULL,
	"generatedAt" timestamp DEFAULT now() NOT NULL,
	"generatedBy" uuid,
	"paidAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoicesTable_invoiceNo_unique" UNIQUE("invoiceNo")
);
--> statement-breakpoint
CREATE TABLE "studentFeeAssignmentsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "studentFeeAssignmentsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
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
CREATE TABLE "transactionsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "transactionsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"transactionId" varchar(100) NOT NULL,
	"invoiceId" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"paymentMode" "paymentMode" NOT NULL,
	"paymentDetails" jsonb,
	"collectedBy" uuid,
	"transactionDate" timestamp DEFAULT now() NOT NULL,
	"receiptNo" varchar(50),
	"notes" text,
	"status" "transactionStatus" DEFAULT 'SUCCESS' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactionsTable_transactionId_unique" UNIQUE("transactionId"),
	CONSTRAINT "transactionsTable_receiptNo_unique" UNIQUE("receiptNo")
);
--> statement-breakpoint
ALTER TABLE "parentsTable" ADD CONSTRAINT "parentsTable_studentId_studentsTable_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."studentsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parentsTable" ADD CONSTRAINT "parentsTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resetPasswordTable" ADD CONSTRAINT "resetPasswordTable_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentParentMapTable" ADD CONSTRAINT "studentParentMapTable_studentId_studentsTable_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."studentsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentParentMapTable" ADD CONSTRAINT "studentParentMapTable_parentId_parentsTable_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."parentsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userRoleTable" ADD CONSTRAINT "userRoleTable_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userRoleTable" ADD CONSTRAINT "userRoleTable_roleId_rolesTable_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."rolesTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userRoleTable" ADD CONSTRAINT "userRoleTable_assignedBy_users_id_fk" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolesTable" ADD CONSTRAINT "rolesTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolePermissionTable" ADD CONSTRAINT "rolePermissionTable_roleId_rolesTable_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."rolesTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolePermissionTable" ADD CONSTRAINT "rolePermissionTable_permissionId_permissionsTable_id_fk" FOREIGN KEY ("permissionId") REFERENCES "public"."permissionsTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academicYearsTable" ADD CONSTRAINT "academicYearsTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissionsTable" ADD CONSTRAINT "admissionsTable_academicYearId_academicYearsTable_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYearsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissionsTable" ADD CONSTRAINT "admissionsTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissionsTable" ADD CONSTRAINT "admissionsTable_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissionsTable" ADD CONSTRAINT "admissionsTable_classId_classesTable_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classesTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classSubjectsTable" ADD CONSTRAINT "classSubjectsTable_classId_classesTable_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classesTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classSubjectsTable" ADD CONSTRAINT "classSubjectsTable_subjectId_subjectsTable_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subjectsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classSubjectsTable" ADD CONSTRAINT "classSubjectsTable_academicYearId_academicYearsTable_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYearsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classesTable" ADD CONSTRAINT "classesTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classesTable" ADD CONSTRAINT "classesTable_academicYearId_academicYearsTable_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYearsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectionsTable" ADD CONSTRAINT "sectionsTable_classId_classesTable_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classesTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectionsTable" ADD CONSTRAINT "sectionsTable_classTeacherId_staffTable_id_fk" FOREIGN KEY ("classTeacherId") REFERENCES "public"."staffTable"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjectAllocationsTable" ADD CONSTRAINT "subjectAllocationsTable_academicYearId_academicYearsTable_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYearsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjectAllocationsTable" ADD CONSTRAINT "subjectAllocationsTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjectAllocationsTable" ADD CONSTRAINT "subjectAllocationsTable_classId_classesTable_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classesTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjectAllocationsTable" ADD CONSTRAINT "subjectAllocationsTable_sectionId_sectionsTable_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."sectionsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjectAllocationsTable" ADD CONSTRAINT "subjectAllocationsTable_subjectId_classSubjectsTable_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."classSubjectsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjectAllocationsTable" ADD CONSTRAINT "subjectAllocationsTable_teacherId_staffTable_id_fk" FOREIGN KEY ("teacherId") REFERENCES "public"."staffTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjectsTable" ADD CONSTRAINT "subjectsTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeTableSlotsTable" ADD CONSTRAINT "timeTableSlotsTable_classId_classesTable_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classesTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeTableSlotsTable" ADD CONSTRAINT "timeTableSlotsTable_sectionId_sectionsTable_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."sectionsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeTableSlotsTable" ADD CONSTRAINT "timeTableSlotsTable_subjectAllocationId_subjectAllocationsTable_id_fk" FOREIGN KEY ("subjectAllocationId") REFERENCES "public"."subjectAllocationsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffAttendanceTable" ADD CONSTRAINT "staffAttendanceTable_staffId_staffTable_id_fk" FOREIGN KEY ("staffId") REFERENCES "public"."staffTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffTable" ADD CONSTRAINT "staffTable_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacherProfileTable" ADD CONSTRAINT "teacherProfileTable_staffId_staffTable_id_fk" FOREIGN KEY ("staffId") REFERENCES "public"."staffTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacherProfileTable" ADD CONSTRAINT "teacherProfileTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentAttendance" ADD CONSTRAINT "studentAttendance_studentId_studentsTable_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."studentsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentDocumentsTable" ADD CONSTRAINT "studentDocumentsTable_studentId_studentsTable_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."studentsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentsTable" ADD CONSTRAINT "studentsTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentsTable" ADD CONSTRAINT "studentsTable_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentsTable" ADD CONSTRAINT "studentsTable_currentClassId_classesTable_id_fk" FOREIGN KEY ("currentClassId") REFERENCES "public"."classesTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentsTable" ADD CONSTRAINT "studentsTable_currentSectionId_sectionsTable_id_fk" FOREIGN KEY ("currentSectionId") REFERENCES "public"."sectionsTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeHeadsTable" ADD CONSTRAINT "feeHeadsTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeInstallmentsTable" ADD CONSTRAINT "feeInstallmentsTable_academicYearId_academicYearsTable_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYearsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeInstallmentsTable" ADD CONSTRAINT "feeInstallmentsTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeStructuresTable" ADD CONSTRAINT "feeStructuresTable_academicYearId_academicYearsTable_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYearsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeStructuresTable" ADD CONSTRAINT "feeStructuresTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeStructuresTable" ADD CONSTRAINT "feeStructuresTable_classId_classesTable_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classesTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeStructuresTable" ADD CONSTRAINT "feeStructuresTable_feeHeadId_feeHeadsTable_id_fk" FOREIGN KEY ("feeHeadId") REFERENCES "public"."feeHeadsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoiceLineItemsTable" ADD CONSTRAINT "invoiceLineItemsTable_invoiceId_invoicesTable_id_fk" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoicesTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoiceLineItemsTable" ADD CONSTRAINT "invoiceLineItemsTable_feeHeadId_feeHeadsTable_id_fk" FOREIGN KEY ("feeHeadId") REFERENCES "public"."feeHeadsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoicesTable" ADD CONSTRAINT "invoicesTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoicesTable" ADD CONSTRAINT "invoicesTable_studentId_studentsTable_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."studentsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoicesTable" ADD CONSTRAINT "invoicesTable_installmentId_feeInstallmentsTable_id_fk" FOREIGN KEY ("installmentId") REFERENCES "public"."feeInstallmentsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoicesTable" ADD CONSTRAINT "invoicesTable_academicYearId_academicYearsTable_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYearsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoicesTable" ADD CONSTRAINT "invoicesTable_generatedBy_users_id_fk" FOREIGN KEY ("generatedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentFeeAssignmentsTable" ADD CONSTRAINT "studentFeeAssignmentsTable_studentId_studentsTable_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."studentsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentFeeAssignmentsTable" ADD CONSTRAINT "studentFeeAssignmentsTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentFeeAssignmentsTable" ADD CONSTRAINT "studentFeeAssignmentsTable_feeStructureId_feeStructuresTable_id_fk" FOREIGN KEY ("feeStructureId") REFERENCES "public"."feeStructuresTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentFeeAssignmentsTable" ADD CONSTRAINT "studentFeeAssignmentsTable_assignedBy_users_id_fk" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactionsTable" ADD CONSTRAINT "transactionsTable_invoiceId_invoicesTable_id_fk" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoicesTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactionsTable" ADD CONSTRAINT "transactionsTable_collectedBy_users_id_fk" FOREIGN KEY ("collectedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;