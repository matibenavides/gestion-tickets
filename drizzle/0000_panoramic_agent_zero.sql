CREATE TYPE "public"."ticket_category" AS ENUM('EQUIPOS', 'IMPRESORAS', 'CUENTAS', 'TRASLADOS', 'OTRO');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('DRAFT', 'SENT', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT '' NOT NULL,
	"zone" text DEFAULT '' NOT NULL,
	"whatsapp_number" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" serial NOT NULL,
	"caller_name" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"problem" text DEFAULT '' NOT NULL,
	"raw_note" text DEFAULT '' NOT NULL,
	"category" "ticket_category" DEFAULT 'OTRO' NOT NULL,
	"status" "ticket_status" DEFAULT 'DRAFT' NOT NULL,
	"assigned_contact_id" uuid,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_contact_id_contacts_id_fk" FOREIGN KEY ("assigned_contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;