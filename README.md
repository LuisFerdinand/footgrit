# LigaLokal

**Unified Football Intelligence Platform** — sistem operasi terpadu untuk manajemen
kompetisi, data pemain, dan kecerdasan talenta sepak bola akar rumput.

Dibangun dari `documents/Proposal_FOOTGRIT-OS-FINAL.pdf` untuk PT DVONES Indonesia.
Lingkungan demo, siap ditunjukkan ke calon klien.

## Tujuh modul kerja

| Modul | Rute | Isi |
|-------|------|-----|
| Command Center | `/command-center` | Dasbor operasional real-time, live match monitor, papan peringkat, kepatuhan verifikasi |
| Master Data & Registry | `/registry/*` | Pemain (NISN, kaki dominan, foto, scan KIA), klub (logo tim), pelatih, wasit, venue, aturan kategori usia (KU-8…KU-20, bisa ditambah sendiri) |
| Data Ingestion & Staging | `/ingestion` | Impor CSV dengan pipeline **8 tahap** — validasi skema, fuzzy dedupe, antrian tinjauan, commit + audit |
| Competition & Rules | `/kompetisi` | Format Cup / League / Hybrid / Knockout, fixture otomatis, klasemen real-time + tie-breaker, bagan gugur |
| Match Operations | `/match-ops` | Konsol pertandingan langsung: timer, skor, daftar pemain kedua tim (klik pemain → pop-up catat kejadian), validasi hasil |
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

Kata sandi semua akun: **`ligalokal123`**

| Email | Peran | Akses |
|-------|-------|-------|
| `admin@ligalokal.id` | Administrator | Akses penuh |
| `operator@ligalokal.id` | Operator Kompetisi | Kompetisi, jadwal, match ops, data master |
| `wasit@ligalokal.id` | Wasit | Konsol pertandingan + validasi hasil |
| `pelatih@ligalokal.id` | Pelatih | Skuad klub + analitik pemain |
| `scout@ligalokal.id` | Pemandu Bakat | AI Scout + Player Intelligence |
| `peninjau@ligalokal.id` | Peninjau | Baca-saja |

## Unggahan berkas

Foto pemain & pelatih, logo tim, dan scan KIA diunggah langsung dari formulir dan
disimpan di Postgres (tabel `media`), disajikan lewat `/api/media/[id]` — tidak
butuh layanan eksternal. Gambar diperkecil otomatis di browser sebelum diunggah
(maks 5 MB per berkas). Dokumen KIA bersifat privat: hanya peran dengan izin
verifikasi (admin & operator) yang dapat membukanya, dan tidak disimpan di cache
browser.

## Integrasi opsional

| Layanan | Tanpa konfigurasi | Dengan konfigurasi |
|---------|-------------------|--------------------|
| **Google Gemini** | AI Scout jalan dalam mode demo berbasis data (percentil, per-90, tren) | Set `GEMINI_API_KEY` — laporan otomatis pakai Gemini |

## Stack

Next.js 16 (App Router, Turbopack, `proxy.ts`) · React 19 · Tailwind v4 ·
Drizzle ORM + Neon serverless · Auth.js v5 (Credentials + JWT, RBAC) ·
recharts + SVG kustom · unggahan berkas di Postgres · Google Gemini (opsional).

## Skrip

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run db:generate` | Buat berkas migrasi dari perubahan skema |
| `npm run db:migrate` | Terapkan migrasi ke Neon (jalankan setelah menarik perubahan skema) |
| `npm run db:seed` | Reset + isi ulang seluruh data demo |
| `npm run db:studio` | Drizzle Studio |
| `npm run typecheck` | `tsc --noEmit` |

> Catatan: `npm run db:seed` melakukan `TRUNCATE` seluruh tabel lalu mengisi ulang.
> Setelah re-seed, sesi login lama tetap valid (identitas diselesaikan via email),
> tetapi ID entitas berubah — muat ulang halaman detail bila perlu.
