const STATISTICS = [
  { label: "Gol", type: "goal", events: ["goal", "penalty_goal"] },
  { label: "Assist", type: "assist", events: ["assist"] },
  { label: "Tembakan total", type: "shot_off", events: ["goal", "penalty_goal", "shot_on", "shot_off"] },
  { label: "Tepat sasaran", type: "shot_on", events: ["goal", "penalty_goal", "shot_on"] },
  { label: "Meleset", type: "shot_off", events: ["shot_off"] },
  { label: "Save", type: "save", events: ["save"] },
  { label: "Intersep", type: "interception", events: ["interception"] },
  { label: "Sudut", type: "corner", events: ["corner"] },
  { label: "Pelanggaran", type: "foul", events: ["foul"] },
  { label: "Kartu merah", type: "red_card", events: ["red_card", "second_yellow"] },
  { label: "Kartu kuning", type: "yellow_card", events: ["yellow_card"] },
] as const;

export type MatchStatistic = {
  label: string;
  type: (typeof STATISTICS)[number]["type"];
  home: number;
  away: number;
};

/** Team totals follow the player ledger: a second yellow is counted as a dismissal. */
export function buildMatchStatistics(
  events: { type: string; clubId: string | null; voided?: boolean }[],
  homeClubId: string | null,
  awayClubId: string | null,
): MatchStatistic[] {
  const active = events.filter((event) => !event.voided);
  const count = (clubId: string | null, types: readonly string[]) =>
    clubId ? active.filter((event) => event.clubId === clubId && types.includes(event.type)).length : 0;
  return STATISTICS.map(({ label, type, events: types }) => ({
    label, type, home: count(homeClubId, types), away: count(awayClubId, types),
  }));
}
