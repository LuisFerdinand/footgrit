import type { Metadata } from "next";
import Link from "next/link";
import { listReferees } from "@/lib/queries/registry";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/app/status-badge";
import { SearchBox, FilterSelect } from "@/components/app/list-controls";
import { EmptyState } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Registrasi Wasit" };
export const dynamic = "force-dynamic";

export default async function RefereesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; level?: string }>;
}) {
  const params = await searchParams;
  const rows = await listReferees(params);

  const summary = {
    active: rows.filter((r) => r.status === "active").length,
    expiring: rows.filter((r) => r.status === "expiring").length,
    expired: rows.filter((r) => r.status === "expired").length,
    revoked: rows.filter((r) => r.status === "revoked").length,
  };

  return (
    <div>
      <PageHeader
        title="Registrasi Wasit"
        description="Manajemen lisensi wasit dan pemantauan status keaktifan."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Aktif", summary.active, "success"],
          ["Akan Kedaluwarsa", summary.expiring, "warn"],
          ["Kedaluwarsa", summary.expired, "danger"],
          ["Dicabut", summary.revoked, "neutral"],
        ].map(([label, n, tone]) => (
          <div key={label as string} className="rounded-xl border border-line bg-surface/70 p-3">
            <div className="text-xl font-semibold tabular-nums text-ink">{n as number}</div>
            <div className="mt-0.5 text-[11px] text-ink-muted">{label as string}</div>
          </div>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-line-soft p-3">
          <SearchBox placeholder="Cari nama wasit…" />
          <FilterSelect
            param="status"
            placeholder="Semua status"
            options={[
              { value: "active", label: "Aktif" },
              { value: "expiring", label: "Akan Kedaluwarsa" },
              { value: "expired", label: "Kedaluwarsa" },
              { value: "revoked", label: "Dicabut" },
            ]}
          />
          <FilterSelect
            param="level"
            placeholder="Semua lisensi"
            options={["C-3", "C-2", "C-1", "Nasional"].map((v) => ({ value: v, label: v }))}
          />
        </div>
        {rows.length === 0 ? (
          <EmptyState className="m-4" title="Tidak ada wasit yang cocok" />
        ) : (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH className="w-10"></TH>
                <TH>Nama</TH>
                <TH>Lisensi</TH>
                <TH>No. Lisensi</TH>
                <TH>Berlaku s.d.</TH>
                <TH className="text-right">Memimpin</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <Avatar src={r.photoUrl} name={r.fullName} size={30} />
                  </TD>
                  <TD>
                    <Link href={`/registry/wasit/${r.id}`} className="font-medium text-ink hover:text-grit">
                      {r.fullName}
                    </Link>
                    <span className="ml-1.5 text-[11px] text-ink-muted">{r.specialty}</span>
                  </TD>
                  <TD>
                    <Badge tone="violet">{r.licenseLevel}</Badge>
                  </TD>
                  <TD className="font-mono text-xs text-ink-muted">{r.licenseNumber}</TD>
                  <TD className="text-xs">{r.licenseExpiry ? formatDate(r.licenseExpiry) : "—"}</TD>
                  <TD className="text-right tabular-nums">{r.matchesOfficiated}</TD>
                  <TD>
                    <StatusBadge kind="referee" value={r.status} dot />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
