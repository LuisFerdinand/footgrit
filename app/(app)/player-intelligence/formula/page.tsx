import { getFormulaData } from "@/lib/queries/intelligence";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { FormulaWorkbench } from "./workbench";

export const dynamic = "force-dynamic";

export default async function FormulaPage() {
  const { list, preview } = await getFormulaData();
  const user = await getCurrentUser();
  const canEdit = can(user?.role, "formula:write");

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
    />
  );
}
