import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const TABLES = [
  "audit_logs",
  "ai_reports",
  "scout_shortlists",
  "import_rows",
  "import_batches",
  "match_lineups",
  "match_events",
  "matches",
  "standings",
  "tournament_squad",
  "tournament_teams",
  "tournaments",
  "player_badges",
  "player_season_history",
  "player_stats",
  "players",
  "badges",
  "referees",
  "clubs",
  "venues",
  "scoring_formulas",
  "age_categories",
  "users",
];

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  console.log("→ Truncating all tables…");
  await sql.query(
    `TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );
  console.log("✓ Database cleared.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
