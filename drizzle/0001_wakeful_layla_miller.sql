CREATE TABLE "raw_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "ticket_category" DEFAULT 'OTRO' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "raw_tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "ticket_number" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "ticket_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "raw_tag" text DEFAULT '' NOT NULL;