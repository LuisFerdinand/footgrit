import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* ═══════════════════════════ Enums ═══════════════════════════════════ */

export const userRole = pgEnum("user_role", [
  "admin",
  "operator",
  "referee",
  "coach",
  "scout",
  "viewer",
]);

export const verificationStatus = pgEnum("verification_status", [
  "verified",
  "flagged",
  "pending",
  "rejected",
]);

export const refereeStatus = pgEnum("referee_status", [
  "active",
  "expiring",
  "expired",
  "revoked",
]);

export const clubType = pgEnum("club_type", ["club", "academy"]);
export const venueSurface = pgEnum("venue_surface", [
  "natural",
  "artificial",
  "hybrid",
  "futsal",
]);
export const playerPosition = pgEnum("player_position", ["GK", "DF", "MF", "FW"]);
export const preferredFoot = pgEnum("preferred_foot", ["left", "right", "both"]);

export const tournamentFormat = pgEnum("tournament_format", [
  "cup",
  "league",
  "hybrid",
  "knockout",
]);
export const tournamentStatus = pgEnum("tournament_status", [
  "draft",
  "registration",
  "verification",
  "ready",
  "ongoing",
  "completed",
  "archived",
]);
export const registrationStatus = pgEnum("registration_status", [
  "invited",
  "registered",
  "verified",
  "rejected",
  "withdrawn",
]);

export const matchStage = pgEnum("match_stage", [
  "league",
  "group",
  "round_of_32",
  "round_of_16",
  "quarter",
  "semi",
  "final",
  "third_place",
]);
export const matchStatus = pgEnum("match_status", [
  "scheduled",
  "live",
  "halftime",
  "completed",
  "postponed",
  "cancelled",
]);
export const matchPeriod = pgEnum("match_period", [
  "not_started",
  "first_half",
  "halftime",
  "second_half",
  "extra_time",
  "penalties",
  "full_time",
]);
export const resultStatus = pgEnum("result_status", [
  "unconfirmed",
  "confirmed",
  "disputed",
  "amended",
]);

export const matchEventType = pgEnum("match_event_type", [
  "goal",
  "own_goal",
  "penalty_goal",
  "penalty_missed",
  "assist",
  "shot_on",
  "shot_off",
  "save",
  "yellow_card",
  "red_card",
  "second_yellow",
  "foul",
  "offside",
  "corner",
  "substitution",
  "injury",
  "var_check",
  "period",
]);
export const lineupRole = pgEnum("lineup_role", ["starter", "substitute"]);

export const importEntity = pgEnum("import_entity", [
  "players",
  "clubs",
  "referees",
  "venues",
  "matches",
]);
export const importBatchStatus = pgEnum("import_batch_status", [
  "uploaded",
  "validating",
  "validated",
  "staged",
  "needs_review",
  "importing",
  "completed",
  "failed",
]);
export const importRowStatus = pgEnum("import_row_status", [
  "pending",
  "valid",
  "error",
  "duplicate",
  "needs_review",
  "approved",
  "rejected",
  "imported",
]);

export const aiReportKind = pgEnum("ai_report_kind", [
  "player_scout",
  "player_analysis",
  "match_summary",
  "competition_insight",
  "talent_search",
]);
export const aiReportStatus = pgEnum("ai_report_status", [
  "generated",
  "cached",
  "failed",
]);
export const badgeTier = pgEnum("badge_tier", [
  "bronze",
  "silver",
  "gold",
  "platinum",
]);

/* ═══════════════════════════ Auth ═══════════════════════════════════ */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("viewer"),
  image: text("image"),
  title: text("title"),
  clubId: uuid("club_id"),
  active: boolean("active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ═══════════════════════ Config / Rules ═════════════════════════════ */

export type AgeCategoryRules = {
  matchDuration: number; // total minutes
  halfDuration: number;
  playersOnField: number;
  maxSquad: number;
  substitutions: string;
  ballSize: number;
  fieldType: string;
  notes?: string[];
};

export const ageCategories = pgTable("age_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 12 }).notNull().unique(), // KU-8 … KU-16
  label: text("label").notNull(),
  minAge: integer("min_age").notNull(),
  maxAge: integer("max_age").notNull(),
  birthYearFrom: integer("birth_year_from"),
  birthYearTo: integer("birth_year_to"),
  rules: jsonb("rules").$type<AgeCategoryRules>().notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type FormulaWeights = {
  goal: number;
  assist: number;
  save: number;
  tackle: number;
  interception: number;
  cleanSheet: number;
  keyPass: number;
  duelWon: number;
  yellowCard: number;
  redCard: number;
  minutesPer90: number;
  motm: number;
};

export const scoringFormulas = pgTable("scoring_formulas", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  weights: jsonb("weights").$type<FormulaWeights>().notNull(),
  isActive: boolean("is_active").notNull().default(false),
  version: integer("version").notNull().default(1),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ═══════════════════════════ Registry ══════════════════════════════ */

export const venues = pgTable("venues", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city").notNull(),
  province: text("province"),
  capacity: integer("capacity"),
  fieldCount: integer("field_count").notNull().default(1),
  surface: venueSurface("surface").notNull().default("natural"),
  photoUrl: text("photo_url"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  floodlights: boolean("floodlights").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clubs = pgTable("clubs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  shortName: varchar("short_name", { length: 8 }).notNull(),
  slug: text("slug").notNull().unique(),
  type: clubType("type").notNull().default("club"),
  city: text("city").notNull(),
  province: text("province"),
  foundedYear: integer("founded_year"),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 9 }).default("#00e28a"),
  secondaryColor: varchar("secondary_color", { length: 9 }).default("#0f1620"),
  homeVenueId: uuid("home_venue_id").references(() => venues.id, {
    onDelete: "set null",
  }),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  accreditation: text("accreditation"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const referees = pgTable("referees", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name").notNull(),
  dob: date("dob"),
  city: text("city"),
  licenseLevel: varchar("license_level", { length: 24 }).notNull(), // C-3, C-2, C-1, Nasional
  licenseNumber: varchar("license_number", { length: 40 }).notNull().unique(),
  licenseIssuedAt: date("license_issued_at"),
  licenseExpiry: date("license_expiry").notNull(),
  status: refereeStatus("status").notNull().default("active"),
  photoUrl: text("photo_url"),
  phone: text("phone"),
  email: text("email"),
  matchesOfficiated: integer("matches_officiated").notNull().default(0),
  specialty: text("specialty"), // wasit / asisten wasit / wasit ke-4
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const players = pgTable(
  "players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    nickname: text("nickname"),
    registrationNo: varchar("registration_no", { length: 32 }).notNull().unique(),
    dob: date("dob").notNull(),
    birthPlace: text("birth_place"),
    nationality: text("nationality").notNull().default("Indonesia"),
    gender: varchar("gender", { length: 8 }).notNull().default("L"),
    heightCm: integer("height_cm"),
    weightKg: integer("weight_kg"),
    foot: preferredFoot("foot").notNull().default("right"),
    position: playerPosition("position").notNull(),
    detailedPosition: varchar("detailed_position", { length: 12 }),
    jerseyNumber: integer("jersey_number"),
    clubId: uuid("club_id").references(() => clubs.id, { onDelete: "set null" }),
    ageCategoryId: uuid("age_category_id").references(() => ageCategories.id, {
      onDelete: "set null",
    }),
    photoUrl: text("photo_url"),
    verificationStatus: verificationStatus("verification_status")
      .notNull()
      .default("pending"),
    verificationNotes: text("verification_notes"),
    verifiedBy: uuid("verified_by").references(() => users.id, {
      onDelete: "set null",
    }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    guardianName: text("guardian_name"),
    guardianPhone: text("guardian_phone"),
    bio: text("bio"),
    joinedAt: date("joined_at"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("players_club_idx").on(t.clubId), index("players_age_cat_idx").on(t.ageCategoryId)],
);

/* ═══════════════════ Player stats / history / badges ═══════════════ */

export const playerStats = pgTable(
  "player_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    tournamentId: uuid("tournament_id").references(() => tournaments.id, {
      onDelete: "cascade",
    }),
    season: varchar("season", { length: 16 }).notNull().default("career"),
    appearances: integer("appearances").notNull().default(0),
    minutesPlayed: integer("minutes_played").notNull().default(0),
    goals: integer("goals").notNull().default(0),
    assists: integer("assists").notNull().default(0),
    saves: integer("saves").notNull().default(0),
    tackles: integer("tackles").notNull().default(0),
    interceptions: integer("interceptions").notNull().default(0),
    keyPasses: integer("key_passes").notNull().default(0),
    duelsWon: integer("duels_won").notNull().default(0),
    cleanSheets: integer("clean_sheets").notNull().default(0),
    yellowCards: integer("yellow_cards").notNull().default(0),
    redCards: integer("red_cards").notNull().default(0),
    foulsCommitted: integer("fouls_committed").notNull().default(0),
    motm: integer("motm").notNull().default(0),
    rating: real("rating").notNull().default(0),
    score: real("score").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("player_stats_scope_idx").on(t.playerId, t.tournamentId, t.season),
  ],
);

export const playerSeasonHistory = pgTable("player_season_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  season: varchar("season", { length: 16 }).notNull(),
  clubId: uuid("club_id").references(() => clubs.id, { onDelete: "set null" }),
  ageCategoryCode: varchar("age_category_code", { length: 12 }),
  appearances: integer("appearances").notNull().default(0),
  goals: integer("goals").notNull().default(0),
  assists: integer("assists").notNull().default(0),
  avgRating: real("avg_rating").notNull().default(0),
  note: text("note"),
});

export const badges = pgTable("badges", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 40 }).notNull().default("award"),
  tier: badgeTier("tier").notNull().default("bronze"),
});

export const playerBadges = pgTable(
  "player_badges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    badgeId: uuid("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    context: text("context"),
    tournamentId: uuid("tournament_id").references(() => tournaments.id, {
      onDelete: "set null",
    }),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("player_badge_idx").on(t.playerId, t.badgeId, t.context)],
);

/* ═══════════════════════════ Competitions ══════════════════════════ */

export type Tiebreaker =
  | "points"
  | "headToHead"
  | "goalDifference"
  | "goalsFor"
  | "wins"
  | "fairPlay"
  | "drawLots";

export const tournaments = pgTable("tournaments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  season: varchar("season", { length: 16 }).notNull(),
  format: tournamentFormat("format").notNull(),
  status: tournamentStatus("status").notNull().default("draft"),
  ageCategoryId: uuid("age_category_id").references(() => ageCategories.id, {
    onDelete: "set null",
  }),
  scoringFormulaId: uuid("scoring_formula_id").references(
    () => scoringFormulas.id,
    { onDelete: "set null" },
  ),
  description: text("description"),
  logoUrl: text("logo_url"),
  host: text("host"),
  city: text("city"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  groupCount: integer("group_count").notNull().default(0),
  teamsPerGroup: integer("teams_per_group").notNull().default(0),
  advancePerGroup: integer("advance_per_group").notNull().default(2),
  doubleRound: boolean("double_round").notNull().default(false),
  knockoutLegs: integer("knockout_legs").notNull().default(1),
  pointsWin: integer("points_win").notNull().default(3),
  pointsDraw: integer("points_draw").notNull().default(1),
  pointsLoss: integer("points_loss").notNull().default(0),
  tiebreakers: jsonb("tiebreakers").$type<Tiebreaker[]>().notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tournamentTeams = pgTable(
  "tournament_teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    groupLabel: varchar("group_label", { length: 2 }),
    seed: integer("seed"),
    registrationStatus: registrationStatus("registration_status")
      .notNull()
      .default("registered"),
    squadLockedAt: timestamp("squad_locked_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("tournament_team_idx").on(t.tournamentId, t.clubId)],
);

export const tournamentSquad = pgTable(
  "tournament_squad",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tournamentTeamId: uuid("tournament_team_id")
      .notNull()
      .references(() => tournamentTeams.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    jerseyNumber: integer("jersey_number"),
    registeredAt: timestamp("registered_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("tournament_squad_idx").on(t.tournamentTeamId, t.playerId)],
);

export const standings = pgTable(
  "standings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    groupLabel: varchar("group_label", { length: 2 }).notNull().default("-"),
    played: integer("played").notNull().default(0),
    won: integer("won").notNull().default(0),
    drawn: integer("drawn").notNull().default(0),
    lost: integer("lost").notNull().default(0),
    goalsFor: integer("goals_for").notNull().default(0),
    goalsAgainst: integer("goals_against").notNull().default(0),
    points: integer("points").notNull().default(0),
    fairPlayPoints: integer("fair_play_points").notNull().default(0),
    form: jsonb("form").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    rank: integer("rank").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("standings_idx").on(t.tournamentId, t.clubId, t.groupLabel),
  ],
);

export const matches = pgTable("matches", {
  id: uuid("id").defaultRandom().primaryKey(),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  stage: matchStage("stage").notNull().default("league"),
  round: integer("round").notNull().default(1),
  groupLabel: varchar("group_label", { length: 2 }),
  bracketSlot: varchar("bracket_slot", { length: 16 }), // e.g. SF1, QF3, F
  homeClubId: uuid("home_club_id").references(() => clubs.id, {
    onDelete: "set null",
  }),
  awayClubId: uuid("away_club_id").references(() => clubs.id, {
    onDelete: "set null",
  }),
  homePlaceholder: text("home_placeholder"), // "Juara Grup A"
  awayPlaceholder: text("away_placeholder"),
  venueId: uuid("venue_id").references(() => venues.id, { onDelete: "set null" }),
  refereeId: uuid("referee_id").references(() => referees.id, {
    onDelete: "set null",
  }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  status: matchStatus("status").notNull().default("scheduled"),
  period: matchPeriod("period").notNull().default("not_started"),
  currentMinute: integer("current_minute").notNull().default(0),
  clockStartedAt: timestamp("clock_started_at", { withTimezone: true }),
  homeScore: integer("home_score").notNull().default(0),
  awayScore: integer("away_score").notNull().default(0),
  homeScoreHt: integer("home_score_ht"),
  awayScoreHt: integer("away_score_ht"),
  homePenalties: integer("home_penalties"),
  awayPenalties: integer("away_penalties"),
  homeFormation: varchar("home_formation", { length: 12 }).default("4-3-3"),
  awayFormation: varchar("away_formation", { length: 12 }).default("4-3-3"),
  attendance: integer("attendance"),
  weather: text("weather"),
  resultStatus: resultStatus("result_status").notNull().default("unconfirmed"),
  confirmedBy: uuid("confirmed_by").references(() => users.id, {
    onDelete: "set null",
  }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  amendmentReason: text("amendment_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const matchEvents = pgTable("match_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  type: matchEventType("type").notNull(),
  minute: integer("minute").notNull().default(0),
  addedTime: integer("added_time").notNull().default(0),
  period: matchPeriod("period").notNull().default("first_half"),
  clubId: uuid("club_id").references(() => clubs.id, { onDelete: "set null" }),
  playerId: uuid("player_id").references(() => players.id, {
    onDelete: "set null",
  }),
  relatedPlayerId: uuid("related_player_id").references(() => players.id, {
    onDelete: "set null",
  }),
  x: real("x"),
  y: real("y"),
  detail: jsonb("detail").$type<Record<string, unknown>>(),
  voided: boolean("voided").notNull().default(false),
  voidReason: text("void_reason"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const matchLineups = pgTable(
  "match_lineups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    role: lineupRole("role").notNull().default("starter"),
    slot: varchar("slot", { length: 8 }), // GK, LB, CM1 …
    x: real("x"),
    y: real("y"),
    shirtNumber: integer("shirt_number"),
    isCaptain: boolean("is_captain").notNull().default(false),
    subInMinute: integer("sub_in_minute"),
    subOutMinute: integer("sub_out_minute"),
    rating: real("rating"),
  },
  (t) => [uniqueIndex("match_lineup_idx").on(t.matchId, t.playerId)],
);

/* ═══════════════════════ Data Ingestion ═══════════════════════════ */

export type ImportStage = {
  key: string;
  label: string;
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  detail?: string;
  count?: number;
};

export type ImportIssue = {
  field: string;
  code: string;
  message: string;
  severity: "error" | "warning";
};

export const importBatches = pgTable("import_batches", {
  id: uuid("id").defaultRandom().primaryKey(),
  entity: importEntity("entity").notNull(),
  fileName: text("file_name").notNull(),
  status: importBatchStatus("status").notNull().default("uploaded"),
  totalRows: integer("total_rows").notNull().default(0),
  validRows: integer("valid_rows").notNull().default(0),
  errorRows: integer("error_rows").notNull().default(0),
  duplicateRows: integer("duplicate_rows").notNull().default(0),
  reviewRows: integer("review_rows").notNull().default(0),
  importedRows: integer("imported_rows").notNull().default(0),
  stages: jsonb("stages").$type<ImportStage[]>().notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const importRows = pgTable("import_rows", {
  id: uuid("id").defaultRandom().primaryKey(),
  batchId: uuid("batch_id")
    .notNull()
    .references(() => importBatches.id, { onDelete: "cascade" }),
  rowNumber: integer("row_number").notNull(),
  raw: jsonb("raw").$type<Record<string, string>>().notNull(),
  normalized: jsonb("normalized").$type<Record<string, unknown>>(),
  status: importRowStatus("status").notNull().default("pending"),
  issues: jsonb("issues").$type<ImportIssue[]>().notNull().default(sql`'[]'::jsonb`),
  matchCandidateId: uuid("match_candidate_id"),
  matchCandidateName: text("match_candidate_name"),
  matchScore: real("match_score"),
  resolution: varchar("resolution", { length: 16 }), // create | merge | skip
  resolvedBy: uuid("resolved_by").references(() => users.id, {
    onDelete: "set null",
  }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  importedEntityId: uuid("imported_entity_id"),
});

/* ═══════════════════════ Audit + AI ═══════════════════════════════ */

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorName: text("actor_name"),
  actorRole: text("actor_role"),
  action: varchar("action", { length: 64 }).notNull(),
  entityType: varchar("entity_type", { length: 40 }).notNull(),
  entityId: uuid("entity_id"),
  summary: text("summary").notNull(),
  before: jsonb("before").$type<Record<string, unknown>>(),
  after: jsonb("after").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AiReportResult = {
  headline?: string;
  summary: string;
  sections: { title: string; body: string; bullets?: string[] }[];
  tags?: string[];
  ratings?: { label: string; value: number }[];
  recommendations?: string[];
};

export const aiReports = pgTable("ai_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: aiReportKind("kind").notNull(),
  subjectType: varchar("subject_type", { length: 24 }),
  subjectId: uuid("subject_id"),
  subjectLabel: text("subject_label"),
  query: text("query"),
  result: jsonb("result").$type<AiReportResult>().notNull(),
  model: varchar("model", { length: 40 }).notNull().default("demo"),
  status: aiReportStatus("status").notNull().default("generated"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ShortlistItem = {
  playerId: string;
  name: string;
  reason: string;
  score: number;
};

export const scoutShortlists = pgTable("scout_shortlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  query: text("query"),
  items: jsonb("items").$type<ShortlistItem[]>().notNull(),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ═══════════════════════════ Relations ════════════════════════════ */

export const clubsRelations = relations(clubs, ({ one, many }) => ({
  homeVenue: one(venues, {
    fields: [clubs.homeVenueId],
    references: [venues.id],
  }),
  players: many(players),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  club: one(clubs, { fields: [players.clubId], references: [clubs.id] }),
  ageCategory: one(ageCategories, {
    fields: [players.ageCategoryId],
    references: [ageCategories.id],
  }),
  stats: many(playerStats),
  badges: many(playerBadges),
  seasonHistory: many(playerSeasonHistory),
}));

export const playerStatsRelations = relations(playerStats, ({ one }) => ({
  player: one(players, {
    fields: [playerStats.playerId],
    references: [players.id],
  }),
  tournament: one(tournaments, {
    fields: [playerStats.tournamentId],
    references: [tournaments.id],
  }),
}));

export const playerBadgesRelations = relations(playerBadges, ({ one }) => ({
  player: one(players, {
    fields: [playerBadges.playerId],
    references: [players.id],
  }),
  badge: one(badges, {
    fields: [playerBadges.badgeId],
    references: [badges.id],
  }),
}));

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  ageCategory: one(ageCategories, {
    fields: [tournaments.ageCategoryId],
    references: [ageCategories.id],
  }),
  scoringFormula: one(scoringFormulas, {
    fields: [tournaments.scoringFormulaId],
    references: [scoringFormulas.id],
  }),
  teams: many(tournamentTeams),
  matches: many(matches),
  standings: many(standings),
}));

export const tournamentTeamsRelations = relations(
  tournamentTeams,
  ({ one, many }) => ({
    tournament: one(tournaments, {
      fields: [tournamentTeams.tournamentId],
      references: [tournaments.id],
    }),
    club: one(clubs, {
      fields: [tournamentTeams.clubId],
      references: [clubs.id],
    }),
    squad: many(tournamentSquad),
  }),
);

export const matchesRelations = relations(matches, ({ one, many }) => ({
  tournament: one(tournaments, {
    fields: [matches.tournamentId],
    references: [tournaments.id],
  }),
  homeClub: one(clubs, {
    fields: [matches.homeClubId],
    references: [clubs.id],
    relationName: "homeClub",
  }),
  awayClub: one(clubs, {
    fields: [matches.awayClubId],
    references: [clubs.id],
    relationName: "awayClub",
  }),
  venue: one(venues, { fields: [matches.venueId], references: [venues.id] }),
  referee: one(referees, {
    fields: [matches.refereeId],
    references: [referees.id],
  }),
  events: many(matchEvents),
  lineups: many(matchLineups),
}));

export const matchEventsRelations = relations(matchEvents, ({ one }) => ({
  match: one(matches, {
    fields: [matchEvents.matchId],
    references: [matches.id],
  }),
  club: one(clubs, { fields: [matchEvents.clubId], references: [clubs.id] }),
  player: one(players, {
    fields: [matchEvents.playerId],
    references: [players.id],
    relationName: "eventPlayer",
  }),
  relatedPlayer: one(players, {
    fields: [matchEvents.relatedPlayerId],
    references: [players.id],
    relationName: "eventRelatedPlayer",
  }),
}));

export const standingsRelations = relations(standings, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [standings.tournamentId],
    references: [tournaments.id],
  }),
  club: one(clubs, { fields: [standings.clubId], references: [clubs.id] }),
}));

export const importRowsRelations = relations(importRows, ({ one }) => ({
  batch: one(importBatches, {
    fields: [importRows.batchId],
    references: [importBatches.id],
  }),
}));

/* ═══════════════════════════ Type exports ═════════════════════════ */

export type User = typeof users.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Club = typeof clubs.$inferSelect;
export type Referee = typeof referees.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type AgeCategory = typeof ageCategories.$inferSelect;
export type ScoringFormula = typeof scoringFormulas.$inferSelect;
export type Tournament = typeof tournaments.$inferSelect;
export type TournamentTeam = typeof tournamentTeams.$inferSelect;
export type Standing = typeof standings.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type MatchEvent = typeof matchEvents.$inferSelect;
export type MatchLineup = typeof matchLineups.$inferSelect;
export type PlayerStat = typeof playerStats.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type PlayerBadge = typeof playerBadges.$inferSelect;
export type ImportBatch = typeof importBatches.$inferSelect;
export type ImportRow = typeof importRows.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type AiReport = typeof aiReports.$inferSelect;
export type ScoutShortlist = typeof scoutShortlists.$inferSelect;
