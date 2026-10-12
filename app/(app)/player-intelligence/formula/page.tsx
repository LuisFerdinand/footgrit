import { getFormulaData, getPlayerFilterOptions } from "@/lib/queries/intelligence";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { FormulaWorkbench } from "./workbench";
import { EmptyState } from "@/components/ui/misc";
import type { IntelligenceParams } from "@/lib/intelligence-filters";

export const dynamic = "force-dynamic";

export default async function FormulaPage({ searchParams }: { searchParams: Promise<IntelligenceParams> }) {
  const params = await searchParams;
  const [{ list, preview }, filterOptions] = await Promise.all([getFormulaData(params), getPlayerFilterOptions()]);
  const user = await getCurrentUser();
  const canEdit = can(user?.role, "formula:write");
  if (!list.length) return <EmptyState title="Belum ada formula penilaian" description="Formula diperlukan untuk menampilkan pratinjau skor pemain." />;

  return (
    <FormulaWorkbench
      formulas={list.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        weights: f.weights,
        isActive: f.isActive,
        version: f.version,
      }))}
      preview={preview}
      canEdit={canEdit}
      params={params}
      filterOptions={filterOptions}
    />
  );
}
