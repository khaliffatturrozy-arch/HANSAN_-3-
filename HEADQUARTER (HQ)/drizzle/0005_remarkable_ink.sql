CREATE TABLE "outlet_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"outlet_id" uuid NOT NULL,
	"timezone" text DEFAULT 'Asia/Jakarta' NOT NULL,
	"business_hours" jsonb,
	"kitchen_active" text DEFAULT 'true' NOT NULL,
	"bar_active" text DEFAULT 'true' NOT NULL,
	"kitchen_name" text DEFAULT 'Kitchen' NOT NULL,
	"bar_name" text DEFAULT 'Bar' NOT NULL,
	"kitchen_display_order" text DEFAULT '0' NOT NULL,
	"bar_display_order" text DEFAULT '1' NOT NULL,
	"accept_orders" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outlet_settings_outlet_id_unique" UNIQUE("outlet_id")
);
--> statement-breakpoint
ALTER TABLE "outlet_settings" ADD CONSTRAINT "outlet_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outlet_settings" ADD CONSTRAINT "outlet_settings_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "outlet_settings_org_idx" ON "outlet_settings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "outlet_settings_outlet_idx" ON "outlet_settings" USING btree ("outlet_id");