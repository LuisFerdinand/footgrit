# FOOTGRIT-OS

**Unified Football Intelligence Platform** — sistem operasi terpadu untuk manajemen
kompetisi, data pemain, dan kecerdasan talenta sepak bola akar rumput.

Dibangun dari `documents/Proposal_FOOTGRIT-OS-FINAL.pdf` untuk PT DVONES Indonesia.
Lingkungan demo, siap ditunjukkan ke calon klien.

## Tujuh modul kerja

| Modul | Rute | Isi |
|-------|------|-----|
| Command Center | `/command-center` | Dasbor operasional real-time, live match monitor, papan peringkat, kepatuhan verifikasi |
| Master Data & Registry | `/registry/*` | Pemain, klub, wasit, venue, aturan kategori usia (KU-8…KU-16) |
| Data Ingestion & Staging | `/ingestion` | Impor CSV dengan pipeline **8 tahap** — validasi skema, fuzzy dedupe, antrian tinjauan, commit + audit |
| Competition & Rules | `/kompetisi` | Format Cup / League / Hybrid / Knockout, fixture otomatis, klasemen real-time + tie-breaker, bagan gugur |
| Match Operations | `/match-ops` | Konsol pertandingan langsung: timer, skor, papan taktik 11v11, pencatatan kejadian, validasi hasil |
| Player Intelligence & Radar | `/player-intelligence` | Radar performa, perbandingan head-to-head, **mesin formula penilaian**, galeri lencana |
| AI Scout & Insights | `/ai-scout` | Pencarian talenta bahasa natural, laporan analisis pemain / laga / kompetisi |

## Menjalankan

```bash
npm install
npm run db:migrate   # buat skema di Neon (butuh DATABASE_URL di .env.local)
npm run db:seed      # isi data demo lengkap
npm run dev          # http://localhost:3000
```

`DATABASE_URL` sudah tersedia di `.env.local` (Neon Postgres). `AUTH_SECRET` juga
sudah di-generate.

## Akun demo

Kata sandi semua akun: **`footgrit123`**

| Email | Peran | Akses |
|-------|-------|-------|
| `admin@footgrit.id` | Administrator | Akses penuh |
| `operator@footgrit.id` | Operator Kompetisi | Kompetisi, jadwal, match ops, data master |
| `wasit@footgrit.id` | Wasit | Konsol pertandingan + validasi hasil |
| `pelatih@footgrit.id` | Pelatih | Skuad klub + analitik pemain |
| `scout@footgrit.id` | Pemandu Bakat | AI Scout + Player Intelligence |
| `peninjau@footgrit.id` | Peninjau | Baca-saja |

## Integrasi opsional

| Layanan | Tanpa konfigurasi | Dengan konfigurasi |
|---------|-------------------|--------------------|
| **Cloudinary** | Field foto → tempel URL / avatar inisial otomatis | Widget unggah gambar aktif — set `CLOUDINARY_*` + `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` |
| **Google Gemini** | AI Scout jalan dalam mode demo berbasis data (percentil, per-90, tren) | Set `GEMINI_API_KEY` — laporan otomatis pakai Gemini |

## Stack

Next.js 16 (App Router, Turbopack, `proxy.ts`) · React 19 · Tailwind v4 ·
Drizzle ORM + Neon serverless · Auth.js v5 (Credentials + JWT, RBAC) ·
recharts + SVG kustom · Cloudinary · Google Gemini (opsional).

## Skrip

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run db:generate` | Buat berkas migrasi dari perubahan skema |
| `npm run db:migrate` | Terapkan migrasi ke Neon |
| `npm run db:seed` | Reset + isi ulang seluruh data demo |
| `npm run db:studio` | Drizzle Studio |
| `npm run typecheck` | `tsc --noEmit` |

> Catatan: `npm run db:seed` melakukan `TRUNCATE` seluruh tabel lalu mengisi ulang.
> Setelah re-seed, sesi login lama tetap valid (identitas diselesaikan via email),
> tetapi ID entitas berubah — muat ulang halaman detail bila perlu.
