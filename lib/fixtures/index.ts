/**
 * Fixture generators — pure functions. Given team identifiers they return
 * ordered fixture descriptors that the app materialises into `matches` rows.
 */

export type FixtureMatch = {
  round: number;
  stage: "league" | "group" | "knockout";
  groupLabel?: string;
  bracketSlot?: string;
  home: string | null;
  away: string | null;
  homePlaceholder?: string;
  awayPlaceholder?: string;
};

/** Round-robin via the circle method. Optionally double (home & away). */
export function roundRobin(
  teams: string[],
  opts: { doubleRound?: boolean; stage?: "league" | "group"; groupLabel?: string } = {},
): FixtureMatch[] {
  const stage = opts.stage ?? "league";
  const list = [...teams];
  if (list.length % 2 !== 0) list.push("__BYE__");
  const n = list.length;
  const rounds = n - 1;
  const half = n / 2;
  const out: FixtureMatch[] = [];
  const rotation = [...list];

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const home = rotation[i];
      const away = rotation[n - 1 - i];
      if (home !== "__BYE__" && away !== "__BYE__") {
        // Alternate home/away for fairness across rounds
        const flip = r % 2 === 1;
        out.push({
          round: r + 1,
          stage,
          groupLabel: opts.groupLabel,
          home: flip ? away : home,
          away: flip ? home : away,
        });
      }
    }
    // rotate, keeping first fixed
    rotation.splice(1, 0, rotation.pop()!);
  }

  if (opts.doubleRound) {
    const second = out.map((m) => ({
      ...m,
      round: m.round + rounds,
      home: m.away,
      away: m.home,
    }));
    return [...out, ...second];
  }
  return out;
}

/** Group stage: split teams into groups and round-robin each. */
export function groupStage(
  teams: string[],
  groupCount: number,
  doubleRound = false,
): FixtureMatch[] {
  const groups: string[][] = Array.from({ length: groupCount }, () => []);
  teams.forEach((t, i) => groups[i % groupCount].push(t));
  const labels = "ABCDEFGH".split("");
  return groups.flatMap((g, gi) =>
    roundRobin(g, {
      doubleRound,
      stage: "group",
      groupLabel: labels[gi],
    }),
  );
}

const BRACKET_NAMES: Record<number, string> = {
  32: "round_of_32",
  16: "round_of_16",
  8: "quarter",
  4: "semi",
  2: "final",
};

/** Single-elimination bracket. `entrants` may be real ids or placeholder labels. */
export function knockoutBracket(
  entrants: (string | { placeholder: string })[],
): FixtureMatch[] {
  let size = 2;
  while (size < entrants.length) size *= 2;
  const slots: (string | { placeholder: string } | null)[] = [...entrants];
  while (slots.length < size) slots.push(null);

  const out: FixtureMatch[] = [];
  let round = 1;
  let current = slots;

  while (current.length > 1) {
    const stageKey = BRACKET_NAMES[current.length] ?? "round_of_32";
    const prefix =
      stageKey === "final"
        ? "F"
        : stageKey === "semi"
          ? "SF"
          : stageKey === "quarter"
            ? "QF"
            : stageKey === "round_of_16"
              ? "R16"
              : "R32";
    for (let i = 0; i < current.length; i += 2) {
      const a = current[i];
      const b = current[i + 1];
      out.push({
        round,
        stage: "knockout",
        bracketSlot: `${prefix}${i / 2 + 1}`,
        home: typeof a === "string" ? a : null,
        away: typeof b === "string" ? b : null,
        homePlaceholder:
          a && typeof a !== "string" ? a.placeholder : undefined,
        awayPlaceholder:
          b && typeof b !== "string" ? b.placeholder : undefined,
      });
    }
    current = new Array(current.length / 2).fill(null);
    round++;
  }
  return out;
}

export function stageLabel(stage: string): string {
  const map: Record<string, string> = {
    league: "Liga",
    group: "Fase Grup",
    round_of_32: "Babak 32 Besar",
    round_of_16: "Babak 16 Besar",
    quarter: "Perempat Final",
    semi: "Semifinal",
    final: "Final",
    third_place: "Perebutan Tempat Ketiga",
  };
  return map[stage] ?? stage;
}
