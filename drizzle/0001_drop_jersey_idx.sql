DROP INDEX "players_club_jersey_idx";--> statement-breakpoint
CREATE INDEX "players_club_idx" ON "players" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "players_age_cat_idx" ON "players" USING btree ("age_category_id");