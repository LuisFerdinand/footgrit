CREATE TYPE "public"."coach_status" AS ENUM('active', 'expiring', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('image', 'document');--> statement-breakpoint
CREATE TABLE "coaches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"dob" date,
	"city" text,
	"club_id" uuid,
	"license_level" varchar(24) NOT NULL,
	"license_number" varchar(40) NOT NULL,
	"license_issued_at" date,
	"license_expiry" date NOT NULL,
	"status" "coach_status" DEFAULT 'active' NOT NULL,
	"photo_url" text,
	"phone" text,
	"email" text,
	"experience_years" integer DEFAULT 0 NOT NULL,
	"specialty" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coaches_license_number_unique" UNIQUE("license_number")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "media_kind" NOT NULL,
	"file_name" text,
	"mime_type" varchar(80) NOT NULL,
	"size" integer NOT NULL,
	"data" text NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "nisn" varchar(10);--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "kia_url" text;--> statement-breakpoint
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coaches_club_idx" ON "coaches" USING btree ("club_id");--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_nisn_unique" UNIQUE("nisn");