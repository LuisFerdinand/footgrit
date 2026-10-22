import * as React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Activity, Radar, Trophy, Users } from "lucide-react";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/brand/logo";
import { BRAND } from "@/lib/brand";
import { getI18n } from "@/lib/i18n/server";
import { msg } from "@/lib/i18n/translate";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Masuk") };
}

const highlights = [
  { icon: Trophy, text: msg("Turnamen dengan banyak KU — format Liga & Cup, jadwal manual atau unggah") },
  { icon: Activity, text: msg("Operasional pertandingan real-time — klik pemain, catat kejadian") },
  { icon: Radar, text: msg("Player Intelligence dengan radar performa") },
  { icon: Users, text: msg("Satu sumber data untuk pemain, klub, pelatih, wasit & venue") },
];

export default async function LoginPage() {
  const { t } = await getI18n();
  return (
    <main className="grid min-h-screen bg-base lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — dark, so the white lettering of the logo stays readable */}
      <div className="relative hidden overflow-hidden bg-night text-white lg:block">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full bg-brand/30 blur-3xl"
        />
        <Logo
          title=""
          className="pointer-events-none absolute -bottom-36 -right-32 h-[620px] opacity-[0.07]"
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center justify-between">
            <Link href="/" aria-label={t("Beranda {brand}", { brand: BRAND.name })}>
              <Logo className="h-24" />
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher tone="dark" />
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/25"
              >
                <ArrowLeft className="size-3.5" />
                {t("Beranda")}
              </Link>
            </div>
          </div>

          <div className="max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">
              {t("Sistem Operasi Sepak Bola Akar Rumput")}
            </p>
            <h2 className="mt-4 font-display text-6xl uppercase leading-[0.92] tracking-wide">
              {t("Satu platform untuk kompetisi, pemain & talenta.")}
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-white">
              {t(
                "{brand} menyatukan operator turnamen, wasit, pelatih, dan pemandu bakat dalam satu ruang kerja digital yang terhubung dan dapat diaudit.",
                { brand: BRAND.name },
              )}
            </p>
            <ul className="mt-8 space-y-2.5">
              {highlights.map((h) => (
                <li key={h.text} className="flex items-center gap-3 rounded-2xl bg-white/12 px-3 py-2.5 text-sm font-medium">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-brand">
                    <h.icon className="size-4" />
                  </span>
                  {t.dyn(h.text)}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-white">
            © {new Date().getFullYear()} {BRAND.owner} · {t("Dokumen Rahasia & Terbatas")}
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center px-6 py-12">
        <LanguageSwitcher tone="light" className="absolute right-4 top-4 lg:hidden" />
        <React.Suspense>
          <LoginForm />
        </React.Suspense>
      </div>
    </main>
  );
}
