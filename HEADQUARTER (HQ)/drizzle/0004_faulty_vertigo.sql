ALTER TABLE "outlets" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "outlets" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "outlets" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "outlets" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "outlets" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "outlets" ADD COLUMN "deactivated_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "outlets_org_code_unique" ON "outlets" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "outlets_status_idx" ON "outlets" USING btree ("status");