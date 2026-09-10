import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCapability } from "@/lib/auth/session";
import { getFormOptions } from "@/lib/queries/competition";
import { Card, CardContent } from "@/components/ui/card";
import { TournamentForm } from "./tournament-form";

export const metadata: Metadata = { title: "Turnamen Baru" };

export default async function NewTournamentPage() {
  await requireCapability("competition:write");
  const { ages, formulas, clubs } = await getFormOptions();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/kompetisi"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-3.5" /> Kembali
      </Link>
      <h1 className="text-lg font-semibold tracking-tight text-ink">Buat Turnamen Baru</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Turnamen dibuat dengan status <strong>Draf</strong>. Jadwal pertandingan dapat
        dibuat otomatis setelah peserta ditetapkan.
      </p>
      <Card className="mt-5">
        <CardContent>
          <TournamentForm ages={ages} formulas={formulas} clubs={clubs} />
        </CardContent>
      </Card>
    </div>
  );
}
