export type ScoutFilters = {
  position?: "GK" | "DF" | "MF" | "FW";
  ageCode?: string;
  minGoals?: number;
  minAssists?: number;
  minSaves?: number;
  emphasis: ("attack" | "creation" | "defending" | "keeping" | "discipline" | "workrate")[];
  keywords: string[];
};

const POSITION_HINTS: [RegExp, ScoutFilters["position"]][] = [
  [/kiper|penjaga gawang|goalkeeper|\bgk\b/i, "GK"],
  [/bek|pemain belakang|pertahanan|defender|\bdf\b|centre.?back|full.?back/i, "DF"],
  [/gelandang|tengah|playmaker|midfield|\bmf\b/i, "MF"],
  [/penyerang|striker|winger|sayap|forward|\bfw\b|ujung tombak/i, "FW"],
];

/** Heuristic natural-language → structured scout filters (demo-mode parser). */
export function parseScoutQuery(q: string): ScoutFilters {
  const text = q.toLowerCase();
  const f: ScoutFilters = { emphasis: [], keywords: [] };

  for (const [re, pos] of POSITION_HINTS) {
    if (re.test(text)) {
      f.position = pos;
      break;
    }
  }

  const ku = text.match(/ku[- ]?(\d{1,2})|u[- ]?(\d{1,2})/i);
  if (ku) {
    const n = ku[1] ?? ku[2];
    f.ageCode = `KU-${n}`;
  }

  if (/gol|mencetak|tajam|haus gol|klinis|finishing/i.test(text)) {
    f.emphasis.push("attack");
    f.minGoals = 1;
  }
  if (/assist|umpan|kreat|visi|playmak|kreator|distribusi/i.test(text)) {
    f.emphasis.push("creation");
    f.minAssists = 1;
  }
  if (/bertahan|tekel|intersep|duel|solid|antisipasi|disiplin posisi/i.test(text)) {
    f.emphasis.push("defending");
  }
  if (/penyelamatan|refleks|clean sheet|nirbobol|sapuan/i.test(text)) {
    f.emphasis.push("keeping");
    f.minSaves = 3;
  }
  if (/energi|stamina|kerja keras|pressing|work.?rate|agresif|ngotot/i.test(text)) {
    f.emphasis.push("workrate");
  }
  if (/fair play|tanpa kartu|disiplin|tenang/i.test(text)) {
    f.emphasis.push("discipline");
  }

  // extract adjective keywords
  const kws = text.match(/\b(cepat|lincah|kuat|tinggi|tenang|agresif|klinis|visioner|pekerja keras|konsisten)\b/gi);
  if (kws) f.keywords = [...new Set(kws.map((k) => k.toLowerCase()))];

  if (f.emphasis.length === 0 && f.position === "FW") f.emphasis.push("attack");
  if (f.emphasis.length === 0 && f.position === "MF") f.emphasis.push("creation");
  if (f.emphasis.length === 0) f.emphasis.push("attack");

  return f;
}

export const EMPHASIS_LABEL: Record<string, string> = {
  attack: "Produktivitas gol",
  creation: "Kreativitas & assist",
  defending: "Kontribusi bertahan",
  keeping: "Penjagaan gawang",
  discipline: "Disiplin",
  workrate: "Intensitas kerja",
};
