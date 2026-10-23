/**
 * Logic checks that need no database: position helpers, the match-statistics
 * ledger and the schedule-upload parser. Run with `npm run test:logic`.
 */
import { buildMatchLines } from "@/lib/match-lines";
import { expandPosition, parsePosition, positionLine } from "@/lib/positions";
import { parseSchedule, summarizeSchedule, type ScheduleContext } from "@/lib/schedule-import";
import { checkManualMatch, type ManualMatchContext } from "@/lib/match-schedule";
import { cupBracket, cupNextSlot, matchWinnerSide } from "@/lib/fixtures";
import { competitionStatus, dateSpan, defaultStage, firstCupStage, kuLabel } from "@/lib/ku";
import { crestTint } from "@/lib/crest";
import { resolveMatchSquads } from "@/lib/match-squad";
import { makeVenueSchema } from "@/lib/venue";
import { createT } from "@/lib/i18n/translate";
import { buildMatchStatistics } from "@/lib/match-statistics";
import { participationAt, assertPlaying, assertSubstitution, type ParticipationLineup } from "@/lib/match-participation";
import { withAutomaticSaves } from "@/lib/automatic-saves";
import { QUICK_TYPES } from "@/lib/quick-events";

import { RADAR_AXES, radarValues } from "@/lib/player-metrics";

import { parsePlayerFilters, pageWindow, queryHref, sortPlayerRows } from "@/lib/intelligence-filters";

let failures = 0;
const ok = (cond: unknown, label: string) => {
  if (!cond) failures++;
  console.log(`${cond ? "  ✓" : "  ✗ FAIL"} ${label}`);
};

console.log("\n[radar match counters]");
const radar = radarValues({ goals: 3, assists: 2, shotsOnTarget: 7, saves: 1, interceptions: 4, shotsOffTarget: 5, redCards: 1, yellowCards: 2, minutesPlayed: 60 });
ok(RADAR_AXES.length === 8 && Object.keys(radar).join() === RADAR_AXES.map((a) => a.key).join(), "all eight requested axes are present in order");
ok(radar.goals === 3 && radar.shotsOnTarget === 7 && radar.redCards === 1 && radar.yellowCards === 2, "radar shows actual match counts, without per-90 conversion or discipline inversion");
ok(Object.values(radarValues(null)).every((v) => v === 0), "missing statistics are zero on every axis");

console.log("\n[intelligence filters]");
const invalidFilters = parsePlayerFilters({ minApps: "-4", minRating: "NaN", page: "Infinity", pageSize: "1000000", sort: "bad SQL", position: "invalid", order: "sideways" });
ok(invalidFilters.minApps === 1 && invalidFilters.minRating === 0 && invalidFilters.page === 1 && invalidFilters.pageSize === 20 && invalidFilters.sort === "score" && invalidFilters.position === "", "malformed filters are bounded and unknown sort/position values fall back safely");
ok(parsePlayerFilters({ minApps: ["4", "2"], position: "CB" }).minApps === 4 && parsePlayerFilters({ position: "CB" }).position === "CB", "array URL values and specific positions are understood");
ok(pageWindow(21, 500, 20).page === 2 && pageWindow(0, 5, 20).offset === 0, "empty and out-of-range result pages stay valid");
const candidates = [{ id: "c", name: "Zaki", goals: 2 }, { id: "b", name: "Adi", goals: 5 }, { id: "a", name: "Adi", goals: 5 }];
ok(sortPlayerRows(candidates, "goals", "desc", (p) => p.goals).map((p) => p.id).join() === "a,b,c", "numeric display sorts have stable name and ID tiebreakers");
ok(sortPlayerRows(candidates, "name", "desc", (p) => p.goals)[0].id === "c", "name sorting supports descending order");
const preserved = new URLSearchParams(queryHref({ players: "p1,p2", q: "Adi", club: "club", age: "KU-12", sort: "goals", order: "asc", page: "2" }, { players: "p1", page: "3" }).slice(1));
ok(preserved.get("players") === "p1" && preserved.get("club") === "club" && preserved.get("q") === "Adi" && preserved.get("sort") === "goals" && preserved.get("page") === "3", "selection and pagination links preserve all active filters and sorting");

/* ── positions ─────────────────────────────────────────────────────────── */
console.log("\n[positions]");
ok(positionLine("CB") === "DF" && positionLine("WF") === "MF" && positionLine("RW") === "FW" && positionLine("GK") === "GK", "each role maps to its line");
ok(expandPosition("DF").length === 4 && expandPosition("CB").join() === "CB" && expandPosition("GK").join() === "GK", "a filter value is a role or a whole line");
ok(expandPosition("nope").length === 0 && expandPosition("").length === 0, "unknown / empty filter matches nothing");
const legacy = parsePosition("fw");
ok(legacy?.role === "ST" && legacy.legacy, "old four-way code maps to a default role and is flagged");
ok(parsePosition("cmf")?.role === "CMF" && parsePosition("cmf")?.legacy === false, "specific roles are accepted in any case");
ok(parsePosition("zz") === null && parsePosition("") === null, "garbage is rejected");

/* ── match statistics ledger ───────────────────────────────────────────── */
console.log("\n[match lines]");
const lines = buildMatchLines({
  length: 60,
  lineups: [
    { playerId: "S1", clubId: "H", role: "starter" },
    { playerId: "S2", clubId: "H", role: "starter" },
    { playerId: "B1", clubId: "H", role: "substitute" },
    { playerId: "B2", clubId: "H", role: "substitute" },
  ],
  events: [
    { type: "substitution", minute: 30, clubId: "H", playerId: "S2", relatedPlayerId: "B1" },
    { type: "goal", minute: 40, clubId: "H", playerId: "B1", relatedPlayerId: "S1" },
    { type: "assist", minute: 40, clubId: "H", playerId: "S1", relatedPlayerId: "B1" },
    { type: "yellow_card", minute: 50, clubId: "H", playerId: "S1", relatedPlayerId: null },
    { type: "shot_on", minute: 51, clubId: "A", playerId: "X9", relatedPlayerId: null },
    { type: "var_check", minute: 60, clubId: "H", playerId: "B1", relatedPlayerId: null, detail: { award: "MOTM" } },
  ],
});
const by = Object.fromEntries(lines.map((l) => [l.playerId, l]));
ok(by.S1.minutesPlayed === 60 && by.S1.assists === 1 && by.S1.yellowCards === 1, "starter plays the full match; assist and yellow counted");
ok(by.S2.minutesPlayed === 30, "a starter substituted off has 30 minutes");
ok(by.B1.minutesPlayed === 30 && by.B1.goals === 1 && by.B1.shotsOnTarget === 1 && by.B1.motm === 1, "a substitute counts from coming on; a goal is also a shot on target; MOTM counted");
ok(!by.B2, "an unused substitute is not a participant");
ok(by.X9?.appearances === 1 && by.X9.minutesPlayed === 60 && by.X9.clubId === "A", "a player with only events (no line-up) is assumed to play the whole match, club from the event");
const cards = buildMatchLines({
  length: 90,
  lineups: [],
  events: [
    { type: "yellow_card", minute: 20, clubId: "H", playerId: "P", relatedPlayerId: null },
    { type: "second_yellow", minute: 70, clubId: "H", playerId: "P", relatedPlayerId: null },
  ],
});
ok(cards[0].yellowCards === 2 && cards[0].redCards === 0, "a second yellow counts as a yellow card (the dismissal is not a separate red)");

/* ── schedule upload ───────────────────────────────────────────────────── */
console.log("\n[schedule upload]");
const ctx: ScheduleContext = {
  format: "league",
  teams: [
    { clubId: "c-gmf", short: "GMF", name: "Garuda Muda FC" },
    { clubId: "c-cpf", short: "CPF", name: "Ciputat FC" },
    { clubId: "c-bsa", short: "BSA", name: "Bekasi SA" },
  ],
  venues: [{ id: "v1", name: "Lapangan ABC Senayan" }],
  referees: [
    { id: "r1", license: "WST-2026-1001", name: "Pak Wasit", valid: true },
    { id: "r2", license: "WST-2026-1002", name: "Pak Lama", valid: false },
  ],
  existing: [
    { homeClubId: "c-gmf", awayClubId: "c-bsa", stage: "league", round: 1, scheduledAt: new Date(Date.UTC(2026, 9, 17, 8, 30)), status: "scheduled" },
  ],
};

let r = parseSchedule(
  `home_short,away_short,date,time,round,venue,referee_license
gmf,CPF,2026-10-24,15:30,2,Lapangan ABC Senayan,WST-2026-1001
CPF,BSA,24/10/2026,09.05,2,,
`,
  ctx,
);
ok(!r.error && r.rows.length === 2 && r.rows[0].status === "ok" && r.rows[0].homeClubId === "c-gmf", "club codes resolve case-insensitively");
ok(r.rows[0].scheduledAt === "2026-10-24T08:30:00.000Z", "15:30 WIB is stored as 08:30 UTC");
ok(r.rows[1].scheduledAt === "2026-10-24T02:05:00.000Z", "DD/MM/YYYY and 09.05 are understood");
ok(r.rows[0].venueId === "v1" && r.rows[0].refereeId === "r1" && r.rows[0].stage === "league" && r.rows[0].round === 2, "venue, referee, default stage and round resolved");

r = parseSchedule("﻿tuan_rumah;tamu;tanggal;jam;pekan\r\nGMF;CPF;2026-11-01;16:00;3\r\n", ctx);
ok(!r.error && r.rows[0]?.status === "ok" && r.rows[0].round === 3, "semicolon file with Indonesian column names and a BOM works");

r = parseSchedule(
  `home_short,away_short,date,time,round,stage,venue,referee_license
XYZ,CPF,2026-10-24,15:30,1,,,
GMF,GMF,2026-10-24,15:30,1,,,
GMF,CPF,2026-13-45,25:99,1,,,
GMF,CPF,2026-10-25,15:30,1,babak-aneh,,
GMF,CPF,2026-10-26,15:30,0,,,
GMF,CPF,2026-10-27,15:30,1,,Lapangan Hantu,WST-2026-9999
GMF,CPF,2026-10-28,15:30,5,,,WST-2026-1002
GMF,BSA,2026-10-17,15:30,1,,,
CPF,BSA,2026-10-29,15:30,1,,,
CPF,BSA,2026-10-29,15:30,1,,,
`,
  ctx,
);
const line = (n: number) => r.rows.find((x) => x.line === n)!;
ok(line(2).status === "error" && line(2).issues[0].includes("XYZ"), "unknown club code is an error");
ok(line(3).status === "error" && line(3).issues[0].includes("sama"), "home = away is an error");
ok(line(4).status === "error" && line(4).issues.length >= 2, "bad date and bad time are reported separately");
ok(line(5).status === "error" && line(6).status === "error", "unknown stage and round 0 are errors");
ok(line(7).status === "warning" && line(7).venueId === null && line(7).refereeId === null, "unknown venue / license only warn and are left blank");
ok(line(8).status === "warning" && line(8).refereeId === null, "an expired referee license warns and is left blank");
ok(line(9).status === "duplicate", "a match already in the tournament is skipped");
ok(line(10).status === "ok" && line(11).status === "duplicate", "a repeat inside the file is skipped");
const sum = summarizeSchedule(r.rows);
ok(sum.importable === 3 && sum.errors === 5 && sum.duplicates === 2, `summary counts add up (${sum.importable} ok / ${sum.errors} errors / ${sum.duplicates} duplicates)`);

r = parseSchedule("home_short,away_short,date,time,round\nGMF,CPF,2026-11-07,15:30,2\nGMF,BSA,2026-11-07,16:30,2\n", ctx);
ok(r.rows[0].status === "ok" && r.rows[1].status === "warning", "the same club 60 minutes apart is flagged");
ok(!!parseSchedule("", ctx).error && !!parseSchedule("a,b,c\n1,2,3\n", ctx).error, "an empty file and missing columns are rejected as a whole");

r = parseSchedule("home_short,away_short,date,time\nGMF,CPF,2026-11-07,15:30\n", { ...ctx, format: "cup" });
ok(r.rows[0].status === "ok" && r.rows[0].stage === "semi", "a Cup row without a stage starts where its bracket does (3 SSB → semi-final)");
r = parseSchedule("home_short,away_short,date,time,stage\nGMF,CPF,2026-11-07,15:30,final\n", { ...ctx, format: "cup" });
ok(r.rows[0].stage === "final", "an explicit stage still wins over the default");

/* ── manual match ──────────────────────────────────────────────────────── */
console.log("\n[manual match]");
const mctx: ManualMatchContext = {
  format: "league",
  hasGroups: false,
  teamIds: ["c-gmf", "c-cpf", "c-bsa"],
  venueIds: ["v1"],
  referees: [
    { id: "r1", valid: true },
    { id: "r2", valid: false },
  ],
  existing: [
    { homeClubId: "c-gmf", awayClubId: "c-bsa", stage: "league", round: 1, scheduledAt: new Date(Date.UTC(2026, 9, 17, 8, 30)), status: "scheduled" },
    { homeClubId: "c-cpf", awayClubId: "c-bsa", stage: "league", round: 1, scheduledAt: new Date(Date.UTC(2026, 9, 10, 8, 30)), status: "completed" },
  ],
};
const base = { homeClubId: "c-gmf", awayClubId: "c-cpf", date: "2026-10-24", time: "15:30", stage: "league", round: 2 };
let mm = checkManualMatch(base, mctx);
ok(Object.keys(mm.errors).length === 0 && mm.warnings.length === 0, "a clean match passes");
ok(mm.scheduledAt?.toISOString() === "2026-10-24T08:30:00.000Z", "15:30 WIB is stored as 08:30 UTC");
ok(checkManualMatch({ ...base, awayClubId: "c-gmf" }, mctx).errors.awayClubId?.includes("sama") === true, "home = away is refused");
ok(!!checkManualMatch({ ...base, homeClubId: "c-zzz" }, mctx).errors.homeClubId, "a club outside the KU is refused");
mm = checkManualMatch({ ...base, date: "2026-13-45", time: "25:99" }, mctx);
ok(!!mm.errors.date && !!mm.errors.time && mm.scheduledAt === null, "bad date and bad time are reported separately");
ok(!!checkManualMatch({ ...base, stage: "final" }, mctx).errors.stage, "a cup stage is refused in a league");
ok(!!checkManualMatch({ ...base, round: 0 }, mctx).errors.round && !!checkManualMatch({ ...base, round: 2.5 }, mctx).errors.round, "round must be a whole number 1–99");
ok(!!checkManualMatch({ ...base, venueId: "nope" }, mctx).errors.venueId, "an unknown venue is refused");
ok(!!checkManualMatch({ ...base, refereeId: "r2" }, mctx).errors.refereeId && !checkManualMatch({ ...base, refereeId: "r1" }, mctx).errors.refereeId, "an expired referee license is refused, a valid one passes");
ok(!!checkManualMatch({ ...base, homeClubId: "c-gmf", awayClubId: "c-bsa", round: 1 }, mctx).errors.awayClubId, "the same fixture in the same round is a duplicate");
ok(!checkManualMatch({ ...base, homeClubId: "c-gmf", awayClubId: "c-bsa", round: 2 }, mctx).errors.awayClubId, "the same pairing in another round is fine");
mm = checkManualMatch({ ...base, homeClubId: "c-gmf", awayClubId: "c-cpf", date: "2026-10-17", time: "16:30" }, mctx);
ok(Object.keys(mm.errors).length === 0 && mm.warnings.length === 1, "a club 60 minutes from another match is a warning, not an error");
mm = checkManualMatch({ ...base, homeClubId: "c-cpf", awayClubId: "c-gmf", date: "2026-10-10", time: "15:30" }, mctx);
ok(mm.warnings.length === 0, "a finished match does not clash");
const cupCtx: ManualMatchContext = { ...mctx, format: "cup" };
ok(!checkManualMatch({ ...base, stage: "semi", bracketSlot: "SF1" }, cupCtx).errors.stage && !!checkManualMatch({ ...base, stage: "league" }, cupCtx).errors.stage, "a cup takes knockout stages only");
ok(!!checkManualMatch({ ...base, stage: "semi", bracketSlot: "bad slot!" }, cupCtx).errors.bracketSlot, "a malformed bracket slot is refused");
ok(!checkManualMatch({ ...base, stage: "group" }, { ...cupCtx, hasGroups: true }).errors.stage, "an older cup with a group stage still accepts group matches");

/* ── cup bracket ───────────────────────────────────────────────────────── */
console.log("\n[cup bracket]");
const teams = (n: number) => Array.from({ length: n }, (_, i) => `T${i + 1}`);
for (const n of [2, 3, 4, 5, 6, 7, 8, 12, 16, 32]) {
  const b = cupBracket(teams(n));
  ok(b.length === n - 1, `${n} teams → ${n - 1} matches (every team but the winner loses once)`);
}
let bracket = cupBracket(teams(8));
ok(bracket.filter((f) => f.round === 1).length === 4 && bracket.filter((f) => f.round === 1).every((f) => f.stage === "quarter"), "8 teams start with 4 quarter-finals");
ok(bracket.at(-1)?.stage === "final" && bracket.at(-1)?.bracketSlot === "F1" && bracket.at(-1)?.homePlaceholder === "Pemenang SF1", "the final waits for the semi-final winners");
ok(bracket[0].home === "T1" && bracket[0].away === "T8", "the first seed meets the last seed");
const sideOf = (slot: string) => bracket.find((f) => f.bracketSlot === slot)!;
ok(sideOf("QF1").home === "T1" && sideOf("QF3").home === "T2" && cupNextSlot("QF1")?.slot !== cupNextSlot("QF3")?.slot, "seeds 1 and 2 sit in opposite halves, so they can only meet in the final");
bracket = cupBracket(teams(6));
const r1 = bracket.filter((f) => f.round === 1);
ok(r1.length === 2 && r1.every((f) => f.home && f.away), "6 teams: two real quarter-finals, no phantom ones");
const semi = bracket.filter((f) => f.stage === "semi");
ok(semi.length === 2 && semi.every((f) => [f.home, f.away].some((s) => s === "T1" || s === "T2")), "6 teams: the top two seeds get a bye into the semi-finals");
ok(semi.every((f) => f.homePlaceholder || f.awayPlaceholder), "the other side of each semi-final is still a placeholder");
ok(cupBracket(["A"]).length === 0 && cupBracket([]).length === 0, "fewer than two teams → no bracket");
ok((() => { try { cupBracket(teams(33)); return false; } catch { return true; } })(), "more than 32 teams is refused");

ok(cupNextSlot("QF1")?.slot === "SF1" && cupNextSlot("QF1")?.side === "home" && cupNextSlot("QF2")?.side === "away", "QF1 and QF2 feed SF1");
ok(cupNextSlot("QF3")?.slot === "SF2" && cupNextSlot("QF4")?.slot === "SF2", "QF3 and QF4 feed SF2");
ok(cupNextSlot("SF1")?.slot === "F1" && cupNextSlot("SF1")?.side === "home" && cupNextSlot("SF2")?.side === "away", "the semi-finals feed the final");
ok(cupNextSlot("R161")?.slot === "QF1" && cupNextSlot("R165")?.slot === "QF3" && cupNextSlot("R165")?.side === "home" && cupNextSlot("R322")?.slot === "R161" && cupNextSlot("R3216")?.slot === "R168", "round-of-16 and round-of-32 slots chain correctly");
ok(cupNextSlot("F1") === null && cupNextSlot("F") === null && cupNextSlot("3P") === null && cupNextSlot(null) === null, "the final, the third-place match and unknown names have no next slot");

ok(matchWinnerSide({ homeScore: 2, awayScore: 1 }) === "home" && matchWinnerSide({ homeScore: 0, awayScore: 3 }) === "away", "the higher score wins");
ok(matchWinnerSide({ homeScore: 1, awayScore: 1 }) === null && matchWinnerSide({ homeScore: 1, awayScore: 1, homePenalties: 3, awayPenalties: 3 }) === null, "level with no (or a tied) shoot-out is undecided");
ok(matchWinnerSide({ homeScore: 1, awayScore: 1, homePenalties: 4, awayPenalties: 5 }) === "away", "a level match is decided by the shoot-out");
ok(matchWinnerSide({ homeScore: 2, awayScore: 1, homePenalties: 0, awayPenalties: 9 }) === "home", "penalties are ignored when the score is not level");

/* ── turnamen / KU helpers ─────────────────────────────────────────────── */
console.log("\n[turnamen & KU]");
ok(competitionStatus([]) === "draft", "a Turnamen without KUs is a draft");
ok(competitionStatus(["completed", "registration"]) === "registration", "an unfinished KU outweighs finished ones");
ok(competitionStatus(["ongoing", "registration", "completed"]) === "ongoing", "ongoing wins over registration and completed");
ok(competitionStatus(["completed", "completed"]) === "completed" && competitionStatus(["completed", "archived"]) === "completed", "all finished → completed");
ok(competitionStatus(["archived", "archived"]) === "archived", "all archived → archived");
ok(kuLabel("Liga Pelajar", "KU-14") === "Liga Pelajar · KU-14" && kuLabel("Liga Pelajar", null) === "Liga Pelajar", "a KU is named after its Turnamen and age group");
ok(firstCupStage(2) === "final" && firstCupStage(4) === "semi" && firstCupStage(6) === "quarter" && firstCupStage(8) === "quarter" && firstCupStage(12) === "round_of_16" && firstCupStage(32) === "round_of_32", "a Cup starts in the stage its bracket size implies");
ok(defaultStage("league", 8) === "league" && defaultStage("cup", 4) === "semi" && defaultStage("cup", 0) === "final", "a new match defaults to the KU's first stage");
const span = dateSpan([null, "2026-10-05", "2026-09-01", undefined, "2026-12-31"]);
ok(span.from === "2026-09-01" && span.to === "2026-12-31" && dateSpan([null]).from === null, "the date span ignores empty dates");

/* ── SSB crest tint ────────────────────────────────────────────────────── */
console.log("\n[crest tint]");
ok(crestTint("GMF").bg === crestTint(" gmf ").bg, "the same SSB always gets the same tint, whatever the case or spacing");
ok(/^#[0-9a-f]{6}$/i.test(crestTint("DBJ").bg) && /^#[0-9a-f]{6}$/i.test(crestTint(null).fg), "tints are hex colours, also for a missing code");
ok(new Set(["GMF", "DBJ", "CPF", "RBS", "TEM", "JTU", "PJD", "CRF", "BKF", "BSA"].map((s) => crestTint(s).bg)).size >= 4, "different SSBs spread over several tints");

console.log("\n[match squads]");
const squadRegistry = [
  { id: "P1", name: "One", clubId: "H", secondClubId: "A", position: "GK", jersey: 1 },
  { id: "P2", name: "Two", clubId: "X", secondClubId: "A", position: "ST", jersey: 9 },
];
const fallbackSquad = resolveMatchSquads(["H", "A"], squadRegistry, []);
ok(fallbackSquad.length === 2 && fallbackSquad[0].clubId === "H" && fallbackSquad[1].clubId === "A", "registry fallback supports secondary clubs and prefers the main club in a head-to-head match");
const explicitSquad = resolveMatchSquads(["H", "A"], squadRegistry, [
  { id: "P1", name: "One", clubId: "A", position: "GK", jersey: 12 },
  { id: "P3", name: "Transferred", clubId: "A", position: "ST", jersey: 10 },
]);
ok(explicitSquad.length === 2 && explicitSquad.every((p) => p.clubId === "A") && explicitSquad[0].jersey === 12, "tournament squad preserves its club and shirt numbers, excludes unregistered extras and avoids duplicate fallback players");
ok(resolveMatchSquads([], squadRegistry, explicitSquad).length === 0, "an unresolved match has no roster");

console.log("\n[match statistics]");
const matchStatistics = buildMatchStatistics([
  ...["goal", "penalty_goal", "assist", "shot_on", "shot_off", "save", "interception", "corner", "foul", "red_card", "second_yellow", "yellow_card"].map((type) => ({ type, clubId: "H" })),
  { type: "save", clubId: "A" },
  { type: "save", clubId: "H", voided: true },
], "H", "A");
ok(matchStatistics.length === 11 && matchStatistics.every((s) => s.home > 0), "match statistics cover every quick-record action, corners, fouls and total shots");
ok(matchStatistics.find((s) => s.label === "Tembakan total")?.home === 4 && matchStatistics.find((s) => s.type === "shot_on")?.home === 3, "goals and penalties contribute to total shots and shots on target");
ok(matchStatistics.find((s) => s.type === "save")?.home === 1 && matchStatistics.find((s) => s.type === "save")?.away === 1, "team totals stay separate and voided events do not count");
ok(matchStatistics.find((s) => s.type === "red_card")?.home === 2 && matchStatistics.find((s) => s.type === "yellow_card")?.home === 1, "card totals use the same second-yellow convention as player counters");
ok(buildMatchStatistics([{ type: "save", clubId: null }], null, null).every((s) => s.home === 0 && s.away === 0), "unassigned events do not become team totals");
console.log("\n[venue registration]");
const venueInput = { name: " Lapangan Kota ", city: " Jakarta ", surface: "natural", fieldCount: "1", capacity: "" };
const venueSchema = makeVenueSchema(createT("id", {}));
const blankCapacity = venueSchema.safeParse(venueInput);
ok(blankCapacity.success && blankCapacity.data.capacity === undefined && blankCapacity.data.name === "Lapangan Kota" && !blankCapacity.data.floodlights, "venue form trims names, preserves unknown capacity and accepts unchecked lighting");
const zeroCapacity = venueSchema.safeParse({ ...venueInput, capacity: "0", floodlights: "on" });
ok(zeroCapacity.success && zeroCapacity.data.capacity === 0 && zeroCapacity.data.floodlights, "zero capacity is distinct from unknown capacity and checked lighting is saved");
ok(["-1", "1.5", "2147483648"].every((capacity) => !venueSchema.safeParse({ ...venueInput, capacity }).success), "venue capacity rejects negatives, fractions and values outside the database integer range");
ok(["", "0", "1.5"].every((fieldCount) => !venueSchema.safeParse({ ...venueInput, fieldCount }).success), "a venue needs at least one whole-number field");
ok(!venueSchema.safeParse({ ...venueInput, surface: "unknown" }).success && !venueSchema.safeParse({ ...venueInput, name: " " }).success, "venue registration rejects unknown surfaces and blank names");

console.log("\n[substitution and automatic saves]");
const matchRoster: ParticipationLineup[] = [
  { playerId: "striker", clubId: "H", role: "starter", position: "ST" },
  { playerId: "keeper", clubId: "A", role: "starter", position: "GK" },
  { playerId: "benchKeeper", clubId: "A", role: "substitute", position: "GK" },
  { playerId: "unused", clubId: "A", role: "substitute", position: "ST" },
];
const shot = (minute: number) => ({ type: "shot_on", minute, clubId: "H", playerId: "striker", relatedPlayerId: null });
const sub = { type: "substitution", minute: 20, clubId: "A", playerId: "keeper", relatedPlayerId: "benchKeeper" };
const saveEvents = [shot(10), sub, shot(25), { ...shot(26), type: "goal" }];
const saved = withAutomaticSaves(saveEvents, matchRoster);
ok(saved.filter((e) => e.type === "save" && e.playerId === "keeper").length === 1 && saved.filter((e) => e.type === "save" && e.playerId === "benchKeeper").length === 1, "non-scoring shots credit the opposing keeper on the pitch, including after substitution");
ok(saved.filter((e) => e.type === "save").length === 2, "goals do not generate saves");
ok(withAutomaticSaves([shot(10)], [...matchRoster.map((l) => ({ ...l, slot: l.playerId === "keeper" ? "GK" : null })), { playerId: "fieldGK", clubId: "A", role: "starter", position: "GK", slot: "CB" }]).filter((e) => e.type === "save" && e.playerId === "keeper").length === 1, "match goalkeeper slots take precedence over registry positions");
const saveLines = buildMatchLines({ length: 60, events: saveEvents, lineups: matchRoster });
ok(saveLines.find((l) => l.playerId === "keeper")?.saves === 1 && saveLines.find((l) => l.playerId === "benchKeeper")?.saves === 1, "player statistics include automatic saves and preserve goalkeeper minutes");
ok(participationAt(matchRoster, saveEvents).get("keeper") === "off" && participationAt(matchRoster, saveEvents).get("benchKeeper") === "playing", "substitution disables the outgoing player and activates the incoming reserve");
const throws = (fn: () => void) => { try { fn(); return false; } catch { return true; } };
ok(throws(() => assertPlaying("unused", matchRoster, saveEvents)) && throws(() => assertPlaying("keeper", matchRoster, saveEvents)), "unused reserves and substituted players cannot record actions");
ok(throws(() => assertSubstitution("striker", "keeper", "H", matchRoster, [], 10)) && throws(() => assertSubstitution("benchKeeper", "keeper", "A", matchRoster, saveEvents, 30)), "substitutions reject opposing players and players already used");
ok(!QUICK_TYPES.some((t: string) => t === "save"), "manual save is absent from quick actions");
ok(withAutomaticSaves(saveEvents.filter((e) => e.minute !== 25), matchRoster).filter((e) => e.type === "save").length === 1, "undoing a shot removes its automatic save");
ok(withAutomaticSaves([shot(10), { type: "save", minute: 10, clubId: "A", playerId: "keeper", relatedPlayerId: null }], matchRoster).filter((e) => e.type === "save").length === 1, "legacy manually recorded saves are not double counted");
ok(buildMatchStatistics(saveEvents, "H", "A").find((s) => s.type === "save")?.away === 2, "team save totals follow non-scoring opposing shots");
console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
