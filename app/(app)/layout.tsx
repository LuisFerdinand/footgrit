import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scoringFormulas } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import type { Role } from "@/lib/auth/rbac";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const active = await db.query.scoringFormulas.findFirst({
    where: eq(scoringFormulas.isActive, true),
    columns: { name: true },
  });

  const user = {
    name: session.user.name ?? "Pengguna",
    email: session.user.email ?? "",
    image: session.user.image,
    role: (session.user.role ?? "viewer") as Role,
    title: session.user.title,
  };

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} activeFormula={active?.name ?? null} />
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
