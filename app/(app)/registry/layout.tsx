import { requireCapability } from "@/lib/auth/session";
import { RegistryTabs } from "./tabs";

export default async function RegistryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCapability("registry:read");
  return (
    <div>
      <RegistryTabs />
      {children}
    </div>
  );
}
