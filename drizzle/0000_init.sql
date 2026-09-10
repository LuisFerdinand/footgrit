CREATE TYPE "public"."ai_report_kind" AS ENUM('player_scout', 'player_analysis', 'match_summary', 'competition_insight', 'talent_search');--> statement-breakpoint
CREATE TYPE "public"."ai_report_status" AS ENUM('generated', 'cached', 'failed');--> statement-breakpoint
CREATE TYPE "public"."badge_tier" AS ENUM('bronze', 'silver', 'gold', 'platinum');--> statement-breakpoint
CREATE TYPE "public"."club_type" AS ENUM('club', 'academy');--> statement-breakpoint
CREATE TYPE "public"."import_batch_status" AS ENUM('uploaded', 'validating', 'validated', 'staged', 'needs_review', 'importing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."import_entity" AS ENUM('players', 'clubs', 'referees', 'venues', 'matches');--> statement-breakpoint
CREATE TYPE "public"."import_row_status" AS ENUM('pending', 'valid', 'error', 'duplicate', 'needs_review', 'approved', 'rejected', 'imported');--> statement-breakpoint
CREATE TYPE "public"."lineup_role" AS ENUM('starter', 'substitute');--> statement-breakpoint
CREATE TYPE "public"."match_event_type" AS ENUM('goal', 'own_goal', 'penalty_goal', 'penalty_missed', 'assist', 'shot_on', 'shot_off', 'save', 'yellow_card', 'red_card', 'second_yellow', 'foul', 'offside', 'corner', 'substitution', 'injury', 'var_check', 'period');--> statement-breakpoint
CREATE TYPE "public"."match_period" AS ENUM('not_started', 'first_half', 'halftime', 'second_half', 'extra_time', 'penalties', 'full_time');--> statement-breakpoint
CREATE TYPE "public"."match_stage" AS ENUM('league', 'group', 'round_of_32', 'round_of_16', 'quarter', 'semi', 'final', 'third_place');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'halftime', 'completed', 'postponed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."player_position" AS ENUM('GK', 'DF', 'MF', 'FW');--> statement-breakpoint
CREATE TYPE "public"."preferred_foot" AS ENUM('left', 'right', 'both');--> statement-breakpoint
CREATE TYPE "public"."referee_status" AS ENUM('active', 'expiring', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('invited', 'registered', 'verified', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."result_status" AS ENUM('unconfirmed', 'confirmed', 'disputed', 'amended');--> statement-breakpoint
CREATE TYPE "public"."tournament_format" AS ENUM('cup', 'league', 'hybrid', 'knockout');--> statement-breakpoint
CREATE TYPE "public"."tournament_status" AS ENUM('draft', 'registration', 'verification', 'ready', 'ongoing', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'operator', 'referee', 'coach', 'scout', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."venue_surface" AS ENUM('natural', 'artificial', 'hybrid', 'futsal');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('verified', 'flagged', 'pending', 'rejected');--> statement-breakpoint
CREATE TABLE "age_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(12) NOT NULL,
	"label" text NOT NULL,
	"min_age" integer NOT NULL,
	"max_age" integer NOT NULL,
	"birth_year_from" integer,
	"birth_year_to" integer,
	"rules" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "age_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ai_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "ai_report_kind" NOT NULL,
	"subject_type" varchar(24),
	"subject_id" uuid,
	"subject_label" text,
	"query" text,
	"result" jsonb NOT NULL,
	"model" varchar(40) DEFAULT 'demo' NOT NULL,
	"status" "ai_report_status" DEFAULT 'generated' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_name" text,
	"actor_role" text,
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(40) NOT NULL,
	"entity_id" uuid,
	"summary" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(40) DEFAULT 'award' NOT NULL,
	"tier" "badge_tier" DEFAULT 'bronze' NOT NULL,
	CONSTRAINT "badges_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"short_name" varchar(8) NOT NULL,
	"slug" text NOT NULL,
	"type" "club_type" DEFAULT 'club' NOT NULL,
	"city" text NOT NULL,
	"province" text,
	"founded_year" integer,
	"logo_url" text,
	"primary_color" varchar(9) DEFAULT '#00e28a',
	"secondary_color" varchar(9) DEFAULT '#0f1620',
	"home_venue_id" uuid,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"accreditation" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clubs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity" "import_entity" NOT NULL,
	"file_name" text NOT NULL,
	"status" "import_batch_status" DEFAULT 'uploaded' NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"valid_rows" integer DEFAULT 0 NOT NULL,
	"error_rows" integer DEFAULT 0 NOT NULL,
	"duplicate_rows" integer DEFAULT 0 NOT NULL,
	"review_rows" integer DEFAULT 0 NOT NULL,
	"imported_rows" integer DEFAULT 0 NOT NULL,
	"stages" jsonb NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "import_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"raw" jsonb NOT NULL,
	"normalized" jsonb,
	"status" "import_row_status" DEFAULT 'pending' NOT NULL,
	"issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"match_candidate_id" uuid,
	"match_candidate_name" text,
	"match_score" real,
	"resolution" varchar(16),
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"imported_entity_id" uuid
);
--> statement-breakpoint
CREATE TABLE "match_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"type" "match_event_type" NOT NULL,
	"minute" integer DEFAULT 0 NOT NULL,
	"added_time" integer DEFAULT 0 NOT NULL,
	"period" "match_period" DEFAULT 'first_half' NOT NULL,
	"club_id" uuid,
	"player_id" uuid,
	"related_player_id" uuid,
	"x" real,
	"y" real,
	"detail" jsonb,
	"voided" boolean DEFAULT false NOT NULL,
	"void_reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_lineups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"role" "lineup_role" DEFAULT 'starter' NOT NULL,
	"slot" varchar(8),
	"x" real,
	"y" real,
	"shirt_number" integer,
	"is_captain" boolean DEFAULT false NOT NULL,
	"sub_in_minute" integer,
	"sub_out_minute" integer,
	"rating" real
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"stage" "match_stage" DEFAULT 'league' NOT NULL,
	"round" integer DEFAULT 1 NOT NULL,
	"group_label" varchar(2),
	"bracket_slot" varchar(16),
	"home_club_id" uuid,
	"away_club_id" uuid,
	"home_placeholder" text,
	"away_placeholder" text,
	"venue_id" uuid,
	"referee_id" uuid,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"period" "match_period" DEFAULT 'not_started' NOT NULL,
	"current_minute" integer DEFAULT 0 NOT NULL,
	"clock_started_at" timestamp with time zone,
	"home_score" integer DEFAULT 0 NOT NULL,
	"away_score" integer DEFAULT 0 NOT NULL,
	"home_score_ht" integer,
	"away_score_ht" integer,
	"home_penalties" integer,
	"away_penalties" integer,
	"home_formation" varchar(12) DEFAULT '4-3-3',
	"away_formation" varchar(12) DEFAULT '4-3-3',
	"attendance" integer,
	"weather" text,
	"result_status" "result_status" DEFAULT 'unconfirmed' NOT NULL,
	"confirmed_by" uuid,
	"confirmed_at" timestamp with time zone,
	"amendment_reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"context" text,
	"tournament_id" uuid,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_season_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"season" varchar(16) NOT NULL,
	"club_id" uuid,
	"age_category_code" varchar(12),
	"appearances" integer DEFAULT 0 NOT NULL,
	"goals" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"avg_rating" real DEFAULT 0 NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "player_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"tournament_id" uuid,
	"season" varchar(16) DEFAULT 'career' NOT NULL,
	"appearances" integer DEFAULT 0 NOT NULL,
	"minutes_played" integer DEFAULT 0 NOT NULL,
	"goals" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"saves" integer DEFAULT 0 NOT NULL,
	"tackles" integer DEFAULT 0 NOT NULL,
	"interceptions" integer DEFAULT 0 NOT NULL,
	"key_passes" integer DEFAULT 0 NOT NULL,
	"duels_won" integer DEFAULT 0 NOT NULL,
	"clean_sheets" integer DEFAULT 0 NOT NULL,
	"yellow_cards" integer DEFAULT 0 NOT NULL,
	"red_cards" integer DEFAULT 0 NOT NULL,
	"fouls_committed" integer DEFAULT 0 NOT NULL,
	"motm" integer DEFAULT 0 NOT NULL,
	"rating" real DEFAULT 0 NOT NULL,
	"score" real DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"nickname" text,
	"registration_no" varchar(32) NOT NULL,
	"dob" date NOT NULL,
	"birth_place" text,
	"nationality" text DEFAULT 'Indonesia' NOT NULL,
	"gender" varchar(8) DEFAULT 'L' NOT NULL,
	"height_cm" integer,
	"weight_kg" integer,
	"foot" "preferred_foot" DEFAULT 'right' NOT NULL,
	"position" "player_position" NOT NULL,
	"detailed_position" varchar(12),
	"jersey_number" integer,
	"club_id" uuid,
	"age_category_id" uuid,
	"photo_url" text,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"verification_notes" text,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"guardian_name" text,
	"guardian_phone" text,
	"bio" text,
	"joined_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_registration_no_unique" UNIQUE("registration_no")
);
--> statement-breakpoint
CREATE TABLE "referees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"dob" date,
	"city" text,
	"license_level" varchar(24) NOT NULL,
	"license_number" varchar(40) NOT NULL,
	"license_issued_at" date,
	"license_expiry" date NOT NULL,
	"status" "referee_status" DEFAULT 'active' NOT NULL,
	"photo_url" text,
	"phone" text,
	"email" text,
	"matches_officiated" integer DEFAULT 0 NOT NULL,
	"specialty" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referees_license_number_unique" UNIQUE("license_number")
);
--> statement-breakpoint
CREATE TABLE "scoring_formulas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"weights" jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scout_shortlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"query" text,
	"items" jsonb NOT NULL,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "standings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"group_label" varchar(2) DEFAULT '-' NOT NULL,
	"played" integer DEFAULT 0 NOT NULL,
	"won" integer DEFAULT 0 NOT NULL,
	"drawn" integer DEFAULT 0 NOT NULL,
	"lost" integer DEFAULT 0 NOT NULL,
	"goals_for" integer DEFAULT 0 NOT NULL,
	"goals_against" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"fair_play_points" integer DEFAULT 0 NOT NULL,
	"form" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rank" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_squad" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_team_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"jersey_number" integer,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"group_label" varchar(2),
	"seed" integer,
	"registration_status" "registration_status" DEFAULT 'registered' NOT NULL,
	"squad_locked_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"season" varchar(16) NOT NULL,
	"format" "tournament_format" NOT NULL,
	"status" "tournament_status" DEFAULT 'draft' NOT NULL,
	"age_category_id" uuid,
	"scoring_formula_id" uuid,
	"description" text,
	"logo_url" text,
	"host" text,
	"city" text,
	"start_date" date,
	"end_date" date,
	"group_count" integer DEFAULT 0 NOT NULL,
	"teams_per_group" integer DEFAULT 0 NOT NULL,
	"advance_per_group" integer DEFAULT 2 NOT NULL,
	"double_round" boolean DEFAULT false NOT NULL,
	"knockout_legs" integer DEFAULT 1 NOT NULL,
	"points_win" integer DEFAULT 3 NOT NULL,
	"points_draw" integer DEFAULT 1 NOT NULL,
	"points_loss" integer DEFAULT 0 NOT NULL,
	"tiebreakers" jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournaments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"image" text,
	"title" text,
	"club_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text NOT NULL,
	"province" text,
	"capacity" integer,
	"field_count" integer DEFAULT 1 NOT NULL,
	"surface" "venue_surface" DEFAULT 'natural' NOT NULL,
	"photo_url" text,
	"latitude" real,
	"longitude" real,
	"floodlights" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_home_venue_id_venues_id_fk" FOREIGN KEY ("home_venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_batch_id_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_related_player_id_players_id_fk" FOREIGN KEY ("related_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_lineups" ADD CONSTRAINT "match_lineups_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_lineups" ADD CONSTRAINT "match_lineups_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_lineups" ADD CONSTRAINT "match_lineups_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_club_id_clubs_id_fk" FOREIGN KEY ("home_club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_club_id_clubs_id_fk" FOREIGN KEY ("away_club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_referee_id_referees_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."referees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_badges" ADD CONSTRAINT "player_badges_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_badges" ADD CONSTRAINT "player_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_badges" ADD CONSTRAINT "player_badges_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_history" ADD CONSTRAINT "player_season_history_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_history" ADD CONSTRAINT "player_season_history_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_age_category_id_age_categories_id_fk" FOREIGN KEY ("age_category_id") REFERENCES "public"."age_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_formulas" ADD CONSTRAINT "scoring_formulas_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scout_shortlists" ADD CONSTRAINT "scout_shortlists_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standings" ADD CONSTRAINT "standings_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standings" ADD CONSTRAINT "standings_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_squad" ADD CONSTRAINT "tournament_squad_tournament_team_id_tournament_teams_id_fk" FOREIGN KEY ("tournament_team_id") REFERENCES "public"."tournament_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_squad" ADD CONSTRAINT "tournament_squad_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_age_category_id_age_categories_id_fk" FOREIGN KEY ("age_category_id") REFERENCES "public"."age_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_scoring_formula_id_scoring_formulas_id_fk" FOREIGN KEY ("scoring_formula_id") REFERENCES "public"."scoring_formulas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "match_lineup_idx" ON "match_lineups" USING btree ("match_id","player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_badge_idx" ON "player_badges" USING btree ("player_id","badge_id","context");--> statement-breakpoint
CREATE UNIQUE INDEX "player_stats_scope_idx" ON "player_stats" USING btree ("player_id","tournament_id","season");--> statement-breakpoint
CREATE UNIQUE INDEX "players_club_jersey_idx" ON "players" USING btree ("club_id","jersey_number");--> statement-breakpoint
CREATE UNIQUE INDEX "standings_idx" ON "standings" USING btree ("tournament_id","club_id","group_label");--> statement-breakpoint
CREATE UNIQUE INDEX "tournament_squad_idx" ON "tournament_squad" USING btree ("tournament_team_id","player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tournament_team_idx" ON "tournament_teams" USING btree ("tournament_id","club_id");