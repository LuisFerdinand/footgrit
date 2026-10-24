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

/*
  Login artwork lives in /public/login (extracted from the design file):
  hero-celebration.webp and player-1..4.webp (transparent cut-outs).
  `height` is the cut-out's height as a share of its circle, so the four
  characters keep the proportions of the design.
*/
const players = [
  { src: "/login/player-1.webp", bg: "bg-[#364dbc]", height: "197.6%" },
  { src: "/login/player-2.webp", bg: "bg-brand", height: "179%" },
  { src: "/login/player-3.webp", bg: "bg-[#ffc93d]", height: "190%" },
  { src: "/login/player-4.webp", bg: "bg-[#e090df]", height: "190%" },
];

const highlights = [
  {
    icon: Trophy,
    text: msg("Turnamen dengan banyak KU — format Liga & Cup, jadwal manual atau unggah"),
    tone: "bg-[#364dbc] text-white",
  },
  {
    icon: Activity,
    text: msg("Operasional pertandingan real-time — klik pemain, catat kejadian"),
    tone: "bg-brand text-white",
  },
  {
    icon: Radar,
    text: msg("Player Intelligence dengan radar performa"),
    tone: "bg-[#ffc93d] text-ink",
  },
  {
    icon: Users,
    text: msg("Satu sumber data untuk pemain, klub, pelatih, wasit & venue"),
    tone: "bg-[#e090df] text-ink",
  },
];

export default async function LoginPage() {
  const { t } = await getI18n();
  return (
    <main className="grid min-h-screen bg-base lg:grid-cols-[908fr_1012fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden rounded-br-[9rem] bg-[#393737] text-white lg:block">
        {/* Hero photo — lightened into the dark panel */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login/hero-celebration.webp"
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute inset-x-0 top-0 h-[62.8%] w-full select-none object-cover object-top opacity-60 mix-blend-lighten"
        />
        {/* Oversized logo watermark — only its red ball bleeds into the panel */}
        <Logo
          title=""
          className="pointer-events-none absolute left-[69.4%] top-[75%] h-auto w-[85%] mix-blend-color"
        />

        <div className="relative flex h-full min-h-screen flex-col justify-between gap-10 py-[clamp(1.5rem,3.3vh,2.25rem)]">
          <div className="px-[clamp(1.5rem,3.7vw,4.2rem)]">
            <div className="flex items-start justify-between">
              <Link href="/" aria-label={t("Beranda {brand}", { brand: BRAND.name })}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/landing/logo-dark.png"
                  alt={BRAND.name}
                  width={BRAND.logoSize.width}
                  height={BRAND.logoSize.height}
                  draggable={false}
                  className="block h-32 w-auto max-w-none select-none"
                />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-white/85"
              >
                <ArrowLeft className="size-3.5" />
                {t("Beranda")}
              </Link>
            </div>

            <div className="mt-11 max-w-[34rem]">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.18em]">
                {t("Sistem Operasi Sepak Bola Akar Rumput")}
              </p>
              <h2 className="mt-3 font-headline text-[clamp(3.25rem,3.7vw,4.4rem)] uppercase leading-[0.94]">
                {t("Satu platform untuk kompetisi, pemain & talenta.")}
              </h2>
              <p className="mt-6 text-[11.5px] font-semibold uppercase leading-[1.4] tracking-[0.18em]">
                {t(
                  "{brand} menyatukan operator turnamen, wasit, pelatih, dan pemandu bakat dalam satu ruang kerja digital yang terhubung dan dapat diaudit.",
                  { brand: BRAND.name },
                )}
              </p>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-4 gap-[5px] px-[clamp(1rem,1.7vw,2rem)]">
              {players.map((p) => (
                <div
                  key={p.src}
                  className={`relative aspect-square overflow-hidden rounded-full ${p.bg}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.src}
                    alt=""
                    aria-hidden
                    draggable={false}
                    style={{ height: p.height }}
                    className="pointer-events-none absolute left-1/2 top-[4.3%] w-auto max-w-none -translate-x-1/2 select-none"
                  />
                </div>
              ))}
            </div>

            <ul className="mt-8 flex max-w-[34rem] flex-col gap-1.5 px-[clamp(1.5rem,4.4vw,5rem)]">
              {highlights.map((h) => (
                <li
                  key={h.text}
                  className={`flex min-h-[3.25rem] items-center gap-5 rounded-full py-1.5 pl-5 pr-6 text-[11.5px] font-semibold uppercase leading-[1.4] tracking-[0.18em] ${h.tone}`}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-brand">
                    <h.icon className="size-4" />
                  </span>
                  {t.dyn(h.text)}
                </li>
              ))}
            </ul>

            <p className="ml-auto mt-4 max-w-[34%] px-[clamp(1.5rem,3.7vw,4.2rem)] text-right text-[9px] font-semibold uppercase leading-snug tracking-[0.18em] xl:-mt-5">
              © {new Date().getFullYear()} {BRAND.owner} · {t("Dokumen Rahasia & Terbatas")}
            </p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center px-6 py-12">
        <LanguageSwitcher tone="light" className="absolute right-4 top-4 lg:right-8 lg:top-6" />
        <React.Suspense>
          <LoginForm />
        </React.Suspense>
      </div>
    </main>
  );
}
