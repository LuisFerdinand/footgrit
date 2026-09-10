import * as React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Activity, Radar, Trophy, Users } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

const highlights = [
  { icon: Trophy, text: "Manajemen kompetisi Cup, Liga, Hybrid & Knockout" },
  { icon: Activity, text: "Operasional pertandingan real-time + papan taktik" },
  { icon: Radar, text: "Player Intelligence dengan radar performa" },
  { icon: Users, text: "Satu sumber data untuk pemain, klub, wasit & venue" },
];

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand / showcase panel */}
      <div className="relative hidden overflow-hidden border-r border-line bg-surface lg:block">
        <div className="absolute inset-0 bg-grit-grid opacity-60" />
        <div className="absolute -left-32 top-1/3 size-96 rounded-full bg-grit/10 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" />
            Kembali ke beranda
          </Link>

          <div className="max-w-md">
            <p className="mb-3 inline-flex rounded-full border border-grit/25 bg-grit/10 px-3 py-1 text-[11px] font-medium text-grit">
              Sistem Operasi Sepak Bola Akar Rumput
            </p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-balance">
              Satu platform untuk kompetisi, data pemain, dan kecerdasan talenta.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
              FOOTGRIT-OS menyatukan operator turnamen, wasit, pelatih, dan pemandu
              bakat dalam satu ruang kerja digital yang terhubung dan dapat diaudit.
            </p>
            <ul className="mt-8 space-y-3">
              {highlights.map((h) => (
                <li key={h.text} className="flex items-center gap-3 text-sm text-ink-secondary">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-base text-grit">
                    <h.icon className="size-4" />
                  </span>
                  {h.text}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-ink-muted">
            © {new Date().getFullYear()} PT DVONES Indonesia · Dokumen Rahasia & Terbatas
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <React.Suspense>
          <LoginForm />
        </React.Suspense>
      </div>
    </main>
  );
}
