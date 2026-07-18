ALTER TABLE "subscriptionPaymentsTable" ADD COLUMN "invoiceNumber" varchar(50);--> statement-breakpoint
ALTER TABLE "subscriptionPaymentsTable" ADD COLUMN "dueDate" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptionPaymentsTable" ADD CONSTRAINT "subscriptionPaymentsTable_invoiceNumber_unique" UNIQUE("invoiceNumber");