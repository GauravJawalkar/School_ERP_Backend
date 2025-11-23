CREATE TABLE "instituteProfileTable" (
	"id" serial PRIMARY KEY NOT NULL,
	"schoolName" varchar(255) NOT NULL,
	"affiliationNumber" varchar NOT NULL,
	"address" varchar NOT NULL,
	"logo" varchar,
	"contactInfo" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "instituteProfileTable_schoolName_unique" UNIQUE("schoolName"),
	CONSTRAINT "instituteProfileTable_affiliationNumber_unique" UNIQUE("affiliationNumber")
);
--> statement-breakpoint
CREATE TABLE "academicYearsTable" (
	"id" serial PRIMARY KEY NOT NULL,
	"instituteId" integer NOT NULL,
	"name" varchar NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date NOT NULL,
	"isActiveYear" boolean NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academicYearsTable" ADD CONSTRAINT "academicYearsTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE no action ON UPDATE no action;