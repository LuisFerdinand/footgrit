import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { ageCategories, matchDspSubmissions, matchLineups, matches, tournaments, users } from "@/lib/db/schema";
import { getEligibleMatchPlayers } from "@/lib/queries/match-roster";

export const dspSchema = z.object({
  matchId: z.string().uuid(),
  coachName: z.string().trim().min(2).max(200),
  selections: z.array(z.object({ playerId: z.string().uuid(), role: z.enum(["starter", "substitute"]) })).min(1).max(200),
});
export type DspSelection = z.infer<typeof dspSchema>["selections"][number];

export function checkDspSelections(selections: DspSelection[], eligibleIds: string[], rules?: { playersOnField: number; maxSquad: number } | null) {
  if (new Set(selections.map((p) => p.playerId)).size !== selections.length || selections.some((p) => !eligibleIds.includes(p.playerId)))
    throw new Error("Pilih pemain yang terdaftar untuk klub dan KU ini.");
  const starters = selections.filter((p) => p.role === "starter").length;
  if (!starters) throw new Error("Pilih minimal satu starter.");
  if (rules && (starters > rules.playersOnField || selections.length > rules.maxSquad))
    throw new Error(`Maksimal ${rules.playersOnField} starter dan ${rules.maxSquad} pemain sesuai aturan KU.`);
}

/** Uses the same match lock as kick-off: submission and start cannot race. */
export async function submitDsp(userId: string, input: z.infer<typeof dspSchema>) {
  const v = dspSchema.parse(input);
  return db.transaction(async (tx) => {
    const [actor] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
    if (!actor?.active || actor.role !== "coach" || !actor.clubId) throw new Error("DSP hanya dapat diisi oleh pelatih klub terkait.");
    const [m] = await tx.select().from(matches).where(eq(matches.id, v.matchId)).for("update");
    if (!m || m.status !== "scheduled" || m.period !== "not_started") throw new Error("DSP terkunci karena pertandingan sudah dimulai atau tidak terjadwal.");
    if (m.homeClubId !== actor.clubId && m.awayClubId !== actor.clubId) throw new Error("Pertandingan ini bukan milik klub Anda.");
    const eligible = await getEligibleMatchPlayers(m.tournamentId, [actor.clubId], tx);
    const [ku] = await tx.select({ rules: ageCategories.rules }).from(tournaments)
      .leftJoin(ageCategories, eq(ageCategories.id, tournaments.ageCategoryId)).where(eq(tournaments.id, m.tournamentId));
    checkDspSelections(v.selections, eligible.map((p) => p.id), ku?.rules);
    if (v.selections.filter((s) => s.role === "starter" && eligible.find((p) => p.id === s.playerId)?.position === "GK").length > 1)
      throw new Error("Pilih satu kiper sebagai starter; kiper lainnya dapat menjadi cadangan.");
    const clubId = actor.clubId;
    const opponentLineup = await tx.select().from(matchLineups).where(eq(matchLineups.matchId, m.id));
    if (v.selections.some((s) => opponentLineup.some((l) => l.clubId !== clubId && l.playerId === s.playerId)))
      throw new Error("Pemain sudah dipilih oleh tim lawan pada pertandingan ini.");
    const [previous] = await tx.select().from(matchDspSubmissions).where(and(eq(matchDspSubmissions.matchId, m.id), eq(matchDspSubmissions.clubId, clubId)));
    await tx.delete(matchLineups).where(and(eq(matchLineups.matchId, m.id), eq(matchLineups.clubId, clubId)));
    await tx.insert(matchLineups).values(v.selections.map((p) => ({ matchId: m.id, clubId, playerId: p.playerId, role: p.role,
      shirtNumber: eligible.find((e) => e.id === p.playerId)?.jersey, slot: eligible.find((e) => e.id === p.playerId)?.position === "GK" ? "GK" : null })));
    const submission = { submittedBy: actor.id, coachName: v.coachName, submittedAt: new Date() };
    if (previous) await tx.update(matchDspSubmissions).set(submission).where(eq(matchDspSubmissions.id, previous.id));
    else await tx.insert(matchDspSubmissions).values({ matchId: m.id, clubId, ...submission });
    return { tournamentId: m.tournamentId, clubId, revised: !!previous, playerCount: v.selections.length };
  });
}
