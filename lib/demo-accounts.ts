import type { Role } from "@/lib/auth/rbac";

/**
 * Demo credentials seeded by `npm run db:seed`.
 * Shared between the seed script and the login screen quick-fill.
 * These are showcase-only accounts — rotate before any real deployment.
 */
export const DEMO_PASSWORD = "footgrit123";

export const DEMO_ACCOUNTS: {
  email: string;
  name: string;
  role: Role;
  title: string;
}[] = [
  {
    email: "admin@footgrit.id",
    name: "Rangga Wibisono",
    role: "admin",
    title: "Kepala Sistem & Kompetisi",
  },
  {
    email: "operator@footgrit.id",
    name: "Dewi Anggraini",
    role: "operator",
    title: "Operator Turnamen",
  },
  {
    email: "wasit@footgrit.id",
    name: "Bambang Sudirman",
    role: "referee",
    title: "Wasit Nasional C-1",
  },
  {
    email: "pelatih@footgrit.id",
    name: "Yusuf Maulana",
    role: "coach",
    title: "Pelatih Kepala — Garuda Muda FA",
  },
  {
    email: "scout@footgrit.id",
    name: "Nadia Rahmawati",
    role: "scout",
    title: "Pemandu Bakat Regional",
  },
  {
    email: "peninjau@footgrit.id",
    name: "Sekretariat Liga",
    role: "viewer",
    title: "Sekretariat & Media",
  },
];
