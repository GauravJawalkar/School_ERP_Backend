CREATE TYPE "public"."relation" AS ENUM('FATHER', 'MOTHER', 'GUARDIAN');--> statement-breakpoint
CREATE TABLE "parentsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "parentsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" uuid NOT NULL,
	"fatherName" varchar(100) NOT NULL,
	"motherName" varchar(100) NOT NULL,
	"fatherContactNo" varchar(20) NOT NULL,
	"motherContactNo" varchar(20) NOT NULL,
	"email" varchar(50),
	"whatsAppNo" varchar(20),
	"address" varchar(200) NOT NULL
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
ALTER TABLE "parentsTable" ADD CONSTRAINT "parentsTable_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentParentMapTable" ADD CONSTRAINT "studentParentMapTable_studentId_studentsTable_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."studentsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentParentMapTable" ADD CONSTRAINT "studentParentMapTable_parentId_parentsTable_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."parentsTable"("id") ON DELETE cascade ON UPDATE no action;