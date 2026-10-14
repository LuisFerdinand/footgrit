"use server";

import { revalidatePath } from "next/cache";
import { actionUser } from "@/lib/auth/session";
import { submitDsp, type dspSchema } from "@/lib/dsp";
import type { z } from "zod";
import { recordAudit } from "@/lib/audit";

export async function saveDsp(input: z.infer<typeof dspSchema>) {
  const actor = await actionUser("dsp:write");
  const result = await submitDsp(actor.id, input);
  await recordAudit({ actorId: actor.id, actorName: actor.name, actorRole: actor.role, action: "dsp.submit", entityType: "match", entityId: input.matchId,
    summary: `${result.revised ? "Revisi" : "Submit"} DSP: ${input.coachName}, ${result.playerCount} pemain`, after: { clubId: result.clubId, selections: input.selections } });
  revalidatePath("/dsp");
  revalidatePath("/match-ops", "layout");
  revalidatePath("/kompetisi", "layout");
  revalidatePath("/command-center");
}
