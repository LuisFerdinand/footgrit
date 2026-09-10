import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  LayoutDashboard,
  Database,
  FileInput,
  Trophy,
  Radio,
  Radar,
  Sparkles,
  ShieldCheck,
  Activity,
  GitBranch,
  Keyboard,
  ScrollText,
  Check,
} from "lucide-react";

export const metadata: Metadata = {
  title: "FOOTGRIT-OS — Unified Football Intelligence Platform",
  description:
    "Sistem operasi terpadu untuk manajemen kompetisi, data pemain, dan kecerdasan talenta sepak bola akar rumput berbasis AI.",
};

const PILLARS = [
  {
    icon: Trophy,
    title: "Competition Management System",
    body: "Pengelolaan turnamen, format kompetisi, jadwal pertandingan, dan klasemen secara otomatis dan akurat.",
  },
  {
    icon: Radio,
    title: "Real-Time Match Operations",
    body: "Kontrol pertandingan langsung, papan taktik visual, dan pencatatan kejadian pertandingan secara real-time.",
  },
  {
    icon: Radar,
    title: "Player Intelligence Platform",
    body: "Profil dan analitik pemain komprehensif, termasuk visualisasi performa dan riwayat karier jangka panjang.",
  },
  {
    icon: Sparkles,
    title: "AI Talent Scout",
    body: "Pencarian dan evaluasi talenta berbasis kecerdasan buatan untuk keputusan scouting yang lebih objektif.",
  },
];

const MODULES = [
  { icon: LayoutDashboard, name: "Command Center", desc: "Dasbor operasional real-time: status sistem, live match monitor, dan papan peringkat." },
  { icon: Database, name: "Master Data & Registry", desc: "Basis data terpusat untuk pemain, klub, wasit, venue, dan aturan kategori usia." },
  { icon: FileInput, name: "Data Ingestion & Staging", desc: "Impor CSV dengan 8 tahap penjaminan kualitas, deteksi duplikasi, dan antrian tinjauan." },
  { icon: Trophy, name: "Competition & Rules", desc: "Format Cup, League, Hybrid & Knockout — fixture otomatis dan klasemen real-time." },
  { icon: Radio, name: "Match Operations", desc: "Konsol pertandingan langsung dengan papan taktik 11v11 dan validasi hasil." },
  { icon: Radar, name: "Player Intelligence & Radar", desc: "Grafik radar performa, perbandingan head-to-head, dan mesin formula penilaian." },
  { icon: Sparkles, name: "AI Scout & Insights", desc: "Pencarian talenta bahasa natural dan laporan analisis pemain otomatis." },
];

const VALUES = [
  { icon: Database, title: "Single Source of Truth", body: "Menghilangkan duplikasi data dan perbedaan versi antar dokumen kerja." },
  { icon: Activity, title: "Real-Time Match Engine", body: "Hasil dan statistik pertandingan tersedia seketika, tanpa jeda pelaporan manual." },
  { icon: Sparkles, title: "AI-Powered Talent Intelligence", body: "Proses scouting lebih objektif, cepat, dan berbasis data terukur." },
  { icon: GitBranch, title: "Longitudinal Player Tracking", body: "Riwayat perkembangan pemain tercatat utuh sepanjang jenjang usia dan karier." },
  { icon: Keyboard, title: "Navigasi Keyboard-First", body: "Efisiensi kerja tim operasional harian, terutama saat hari pertandingan." },
  { icon: ScrollText, title: "Jejak Audit Menyeluruh", body: "Akuntabilitas dan transparansi proses bagi seluruh pemangku kepentingan." },
];

const TIMELINE = [
  { phase: "Bulan ke-1 · Minggu 1–4", body: "Discovery & requirement alignment, konfigurasi Command Center, Master Data & Registry, Data Ingestion, serta migrasi data awal." },
  { phase: "Bulan ke-2 · Minggu 5–8", body: "Konfigurasi Competition & Rules dan Match Operations, User Acceptance Test, pelatihan pengguna, dan go-live disertai hypercare." },
];

export default function LandingPage() {
  return (
    <main className="bg-base">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-line bg-base/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <span className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-grit text-black">
              <span className="text-xs font-black">F</span>
            </span>
            <span className="text-sm font-bold tracking-tight">
              FOOTGRIT<span className="text-grit">-OS</span>
            </span>
          </span>
          <nav className="hidden items-center gap-6 text-xs text-ink-muted md:flex">
            <a href="#pilar" className="hover:text-ink">Empat Pilar</a>
            <a href="#modul" className="hover:text-ink">Modul</a>
            <a href="#nilai" className="hover:text-ink">Nilai Tambah</a>
            <a href="#implementasi" className="hover:text-ink">Implementasi</a>
          </nav>
          <Link
            href="/login"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-grit px-3.5 text-xs font-semibold text-black transition-colors hover:bg-grit-dark"
          >
            Masuk ke Platform <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 bg-grit-grid opacity-40" />
        <div className="absolute -right-40 top-0 size-[28rem] rounded-full bg-grit/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <span className="inline-flex rounded-full border border-grit/25 bg-grit/10 px-3 py-1 text-[11px] font-medium text-grit">
            Sistem Operasi Sepak Bola Akar Rumput · Proposal Solusi
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-balance sm:text-5xl">
            Satu platform untuk kompetisi, data pemain, dan kecerdasan talenta.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-secondary">
            FOOTGRIT-OS mengintegrasikan seluruh aspek operasional — manajemen data pemain
            dan klub, pengelolaan turnamen, operasi pertandingan real-time, hingga intelligent
            talent scouting — dalam satu ekosistem digital yang terhubung dan dapat diaudit.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-grit px-6 text-sm font-semibold text-black transition-colors hover:bg-grit-dark"
            >
              Jelajahi Demo Platform <ArrowRight className="size-4" />
            </Link>
            <a
              href="#modul"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-6 text-sm text-ink-secondary transition-colors hover:text-ink"
            >
              Lihat 7 Modul Kerja
            </a>
          </div>
          <div className="mt-12 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            {[
              ["7", "Modul kerja"],
              ["4", "Format kompetisi"],
              ["8", "Tahap QA data"],
              ["100%", "Dapat diaudit"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="text-2xl font-semibold tabular-nums text-ink">{n}</div>
                <div className="text-xs text-ink-muted">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Challenges */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Memahami tantangan operasional Anda</h2>
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[
            "Data pemain tersebar di berbagai spreadsheet dan dokumen terpisah",
            "Pengelolaan turnamen dilakukan secara manual dan rawan kesalahan",
            "Pelaporan statistik pertandingan berjalan lambat",
            "Identifikasi talenta bersifat subjektif dan bergantung pengamatan manual",
            "Komunikasi antar pemangku kepentingan terfragmentasi",
            "Riwayat perkembangan pemain berisiko hilang antar musim",
          ].map((c) => (
            <div key={c} className="rounded-xl border border-line bg-surface/60 p-4 text-sm text-ink-secondary">
              {c}
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section id="pilar" className="border-y border-line bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Empat pilar yang saling terintegrasi</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Seluruh pilar terhubung melalui satu lapisan manajemen data terpusat — setiap perubahan
            langsung tercermin di seluruh bagian sistem tanpa sinkronisasi manual.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PILLARS.map((p) => (
              <div key={p.title} className="rounded-xl border border-line bg-base p-5">
                <span className="grid size-9 place-items-center rounded-lg border border-grit/25 bg-grit/10 text-grit">
                  <p.icon className="size-4" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-ink">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modul" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Tujuh modul kerja (workspace)</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Dirancang mengikuti alur kerja nyata organisasi pengelola kompetisi, dari perencanaan hingga evaluasi pasca-pertandingan.
        </p>
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, i) => (
            <div key={m.name} className="group rounded-xl border border-line bg-surface/60 p-5 transition-colors hover:border-grit/40">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg border border-line bg-base text-ink-secondary group-hover:text-grit">
                  <m.icon className="size-4" />
                </span>
                <span className="text-[10px] font-semibold tabular-nums text-ink-muted">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink">{m.name}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section id="nilai" className="border-y border-line bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Nilai tambah bagi organisasi Anda</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="flex gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-base text-grit">
                  <v.icon className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{v.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation */}
      <section id="implementasi" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Pendekatan implementasi bertahap</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Direncanakan tuntas dalam 2 (dua) bulan sejak kick-off, terbagi ke dalam dua periode kerja utama.
        </p>
        <div className="mt-8 space-y-3">
          {TIMELINE.map((t, i) => (
            <div key={i} className="flex gap-4 rounded-xl border border-line bg-surface/60 p-5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-grit text-sm font-bold text-black">
                {i + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-ink">{t.phase}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Platform terkonfigurasi sesuai kebutuhan organisasi",
            "Migrasi data master (pemain, klub, wasit, venue)",
            "Dokumentasi penggunaan sistem per peran",
            "Sesi pelatihan pengguna operasional",
            "Pendampingan masa awal (hypercare support)",
            "Keamanan data — kredensial via environment, rate limiting AI",
          ].map((d) => (
            <div key={d} className="flex items-start gap-2 text-xs text-ink-secondary">
              <Check className="mt-0.5 size-3.5 shrink-0 text-grit" />
              {d}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-line bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <ShieldCheck className="mx-auto size-8 text-grit" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">
            Siap melihat FOOTGRIT-OS bekerja?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink-muted">
            Masuk ke lingkungan demo untuk menjelajahi seluruh tujuh modul dengan data kompetisi
            akar rumput yang lengkap.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-grit px-6 text-sm font-semibold text-black transition-colors hover:bg-grit-dark"
          >
            Masuk ke Platform <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-8 text-[11px] text-ink-muted sm:flex-row">
          <span>FOOTGRIT-OS — Unified Football Intelligence Platform</span>
          <span>© {new Date().getFullYear()} PT DVONES Indonesia · Dokumen Rahasia & Terbatas</span>
        </div>
      </footer>
    </main>
  );
}
