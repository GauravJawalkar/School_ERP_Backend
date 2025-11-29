CREATE TABLE "staffTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "staffTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" uuid NOT NULL,
	"employeeCode" varchar(50) NOT NULL,
	"firstName" varchar(100) NOT NULL,
	"lastName" varchar(100) NOT NULL,
	"department" varchar,
	"joiningDate" date NOT NULL,
	"salaryBasic" numeric(10, 2) NOT NULL,
	"bankDetails" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "staffTable" ADD CONSTRAINT "staffTable_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;