import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorForm } from "./operator-form";
import { OperatorEdit } from "./operator-edit";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export default async function OperatorsPage() {
  const [rows, user] = await Promise.all([
    db.select({ id: users.id, name: users.name, email: users.email, active: users.active, hasPassword: sql<number>`${users.passwordHash} like '$2%'` }).from(users).where(eq(users.role, "operator")).orderBy(asc(users.name)),
    getCurrentUser(),
  ]);
  const canManage = can(user?.role, "settings:write");
  return <div><PageHeader title="Manajemen Operator" description="Kelola akun dan akses login petugas konsol pertandingan." />
    {canManage && <Card className="mb-4"><CardHeader><CardTitle>Buat akun operator</CardTitle></CardHeader><CardContent><OperatorForm /></CardContent></Card>}
    <Card><CardContent className="overflow-x-auto p-0"><table className="w-full text-left text-sm">
      <thead><tr className="border-b border-line"><th className="p-4">Nama</th><th className="p-4">Email</th><th className="p-4">Status</th>{canManage && <th className="p-4">Aksi</th>}</tr></thead>
      <tbody>{rows.map((o) => <tr key={o.id} className="border-b border-line-soft"><td className="p-4">{o.name}</td><td className="p-4">{o.email}</td><td className="p-4"><Badge tone={o.active ? "success" : "neutral"}>{o.active ? "Aktif" : "Nonaktif"}</Badge>{!o.hasPassword && <p className="mt-1 text-[11px] text-warn">Kata sandi belum diatur</p>}</td>{canManage && <td className="p-4"><OperatorEdit key={o.id + o.name + o.email + o.active} operator={{ id: o.id, name: o.name, email: o.email, active: o.active }} /></td>}</tr>)}</tbody>
    </table>{!rows.length && <p className="p-6 text-center text-xs text-ink-muted">Belum ada operator.</p>}</CardContent></Card>
  </div>;
}
