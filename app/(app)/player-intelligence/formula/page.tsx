import { getFormulaData, getPlayerFilterOptions } from "@/lib/queries/intelligence";
import { requireCapability } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { FormulaWorkbench } from "./workbench";
import { EmptyState } from "@/components/ui/misc";
import type { IntelligenceParams } from "@/lib/intelligence-filters";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function FormulaPage({ searchParams }: { searchParams: Promise<IntelligenceParams> }) {
  const { t } = await getI18n();
  const user = await requireCapability("intelligence.formula:view");
  const params = await searchParams;
  const [{ list, preview }, filterOptions] = await Promise.all([getFormulaData(params), getPlayerFilterOptions()]);
  const canEdit = can(user, "intelligence.formula:edit");
  const canActivate = can(user, "intelligence.formula:activate");
  if (!list.length) return <EmptyState title={t("Belum ada formula penilaian")} description={t("Formula diperlukan untuk menampilkan pratinjau skor pemain.")} />;

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
      canActivate={canActivate}
      params={params}
      filterOptions={filterOptions}
    />
  );
}
