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
ALTER TABLE "subjectsTable" ADD COLUMN "description" varchar(255);--> statement-breakpoint
ALTER TABLE "subjectsTable" ADD COLUMN "isActive" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "subjectsTable" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "subjectsTable" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "classSubjectsTable" ADD CONSTRAINT "classSubjectsTable_classId_classesTable_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classesTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classSubjectsTable" ADD CONSTRAINT "classSubjectsTable_subjectId_subjectsTable_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subjectsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classSubjectsTable" ADD CONSTRAINT "classSubjectsTable_academicYearId_academicYearsTable_id_fk" FOREIGN KEY ("academicYearId") REFERENCES "public"."academicYearsTable"("id") ON DELETE cascade ON UPDATE no action;