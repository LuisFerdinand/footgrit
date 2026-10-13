import type { MatchGoal } from "@/lib/queries/match-goals";

export function GoalScorers({ goals }: { goals: MatchGoal[] }) {
  if (!goals.length) return null;
  return <ul className="mt-2 space-y-1 text-[10px] font-medium leading-relaxed">
    {goals.map((g) => <li key={g.id}>{g.playerName ?? "Pencetak gol belum dicatat"}{g.number != null ? ` (#${g.number})` : ""} {g.minute}{g.addedTime ? `+${g.addedTime}` : ""}′{g.ownGoal ? " (BD)" : ""}</li>)}
  </ul>;
}
