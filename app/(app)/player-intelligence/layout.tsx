import { requireCapability } from "@/lib/auth/session";
import { PageHeader } from "@/components/app/page-header";
import { PiTabs } from "./tabs";

export default async function PiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCapability("intelligence:read");
  return (
    <div>
      <PageHeader
        title="Player Intelligence & Radar"
        description="Visualisasi dan analitik performa pemain untuk mendukung keputusan pembinaan yang lebih terarah."
      />
      <PiTabs />
      <div className="mt-5">{children}</div>
    </div>
  );
}
