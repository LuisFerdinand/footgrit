import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCapability } from "@/lib/auth/session";
import { getClub, getClubFormOptions } from "@/lib/queries/registry";
import { Card, CardContent } from "@/components/ui/card";
import { ClubForm } from "../../club-form";

export const metadata: Metadata = { title: "Ubah Data Klub" };
export const dynamic = "force-dynamic";

export default async function EditClubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCapability("registry:write");
  const { id } = await params;
  const [club, venues] = await Promise.all([getClub(id), getClubFormOptions()]);
  if (!club) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/registry/klub/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-3.5" /> Kembali ke profil klub
      </Link>
      <h1 className="text-lg font-semibold tracking-tight text-ink">Ubah Data Klub</h1>
      <p className="mt-1 text-sm text-ink-muted">{club.name}. Perubahan tercatat pada jejak audit.</p>
      <Card className="mt-5">
        <CardContent>
          <ClubForm venues={venues} club={club} />
        </CardContent>
      </Card>
    </div>
  );
}
