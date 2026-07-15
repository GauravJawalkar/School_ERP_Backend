CREATE TYPE "public"."billingPeriod" AS ENUM('MONTHLY', 'HALF_YEARLY', 'ANNUALLY');--> statement-breakpoint
CREATE TYPE "public"."subscriptionStatus" AS ENUM('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'UNPAID', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "instituteSubscriptionsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "instituteSubscriptionsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"instituteId" integer NOT NULL,
	"planId" integer NOT NULL,
	"priceId" integer NOT NULL,
	"status" "subscriptionStatus" DEFAULT 'ACTIVE' NOT NULL,
	"startDate" timestamp DEFAULT now() NOT NULL,
	"endDate" timestamp NOT NULL,
	"trialEndDate" timestamp,
	"cancelAtPeriodEnd" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "subscriptionPaymentsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscriptionPaymentsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"instituteSubscriptionId" integer NOT NULL,
	"instituteId" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(10) NOT NULL,
	"paymentGateway" varchar(50) NOT NULL,
	"gatewayTransactionId" varchar(100) NOT NULL,
	"status" varchar(50) NOT NULL,
	"invoiceUrl" varchar(255),
	"paidAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptionPaymentsTable_gatewayTransactionId_unique" UNIQUE("gatewayTransactionId")
);
--> statement-breakpoint
CREATE TABLE "subscriptionPlansTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscriptionPlansTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" varchar(255),
	"maxStudents" integer DEFAULT -1 NOT NULL,
	"maxStaff" integer DEFAULT -1 NOT NULL,
	"features" jsonb NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp,
	CONSTRAINT "subscriptionPlansTable_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subscriptionPricesTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscriptionPricesTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"planId" integer NOT NULL,
	"billingPeriod" "billingPeriod" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "instituteSubscriptionsTable" ADD CONSTRAINT "instituteSubscriptionsTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instituteSubscriptionsTable" ADD CONSTRAINT "instituteSubscriptionsTable_planId_subscriptionPlansTable_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."subscriptionPlansTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instituteSubscriptionsTable" ADD CONSTRAINT "instituteSubscriptionsTable_priceId_subscriptionPricesTable_id_fk" FOREIGN KEY ("priceId") REFERENCES "public"."subscriptionPricesTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptionPaymentsTable" ADD CONSTRAINT "subscriptionPaymentsTable_instituteSubscriptionId_instituteSubscriptionsTable_id_fk" FOREIGN KEY ("instituteSubscriptionId") REFERENCES "public"."instituteSubscriptionsTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptionPaymentsTable" ADD CONSTRAINT "subscriptionPaymentsTable_instituteId_instituteProfileTable_id_fk" FOREIGN KEY ("instituteId") REFERENCES "public"."instituteProfileTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptionPricesTable" ADD CONSTRAINT "subscriptionPricesTable_planId_subscriptionPlansTable_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."subscriptionPlansTable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "active_sub_unique_idx" ON "instituteSubscriptionsTable" USING btree ("instituteId") WHERE status = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "institute_sub_inst_idx" ON "instituteSubscriptionsTable" USING btree ("instituteId");--> statement-breakpoint
CREATE INDEX "institute_sub_plan_idx" ON "instituteSubscriptionsTable" USING btree ("planId");--> statement-breakpoint
CREATE INDEX "institute_sub_status_idx" ON "instituteSubscriptionsTable" USING btree ("status");