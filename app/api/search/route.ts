import { NextResponse } from "next/server";
import { ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubs, coaches, players, referees, tournaments, venues } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ results: [] }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });
  const like = `%${q}%`;

  const [pl, cl, rf, co, tn, vn] = await Promise.all([
    db
      .select({ id: players.id, name: players.fullName, reg: players.registrationNo })
      .from(players)
      .where(
        or(
          ilike(players.fullName, like),
          ilike(players.registrationNo, like),
          ilike(players.nisn, like),
        ),
      )
      .limit(6),
    db
      .select({ id: clubs.id, name: clubs.name, short: clubs.shortName })
      .from(clubs)
      .where(or(ilike(clubs.name, like), ilike(clubs.shortName, like)))
      .limit(4),
    db
      .select({ id: referees.id, name: referees.fullName })
      .from(referees)
      .where(ilike(referees.fullName, like))
      .limit(3),
    db
      .select({ id: coaches.id, name: coaches.fullName, level: coaches.licenseLevel })
      .from(coaches)
      .where(or(ilike(coaches.fullName, like), ilike(coaches.licenseNumber, like)))
      .limit(3),
    db
      .select({ id: tournaments.id, name: tournaments.name })
      .from(tournaments)
      .where(ilike(tournaments.name, like))
      .limit(3),
    db
      .select({ id: venues.id, name: venues.name })
      .from(venues)
      .where(ilike(venues.name, like))
      .limit(3),
  ]);

  void sql;
  const results = [
    ...pl.map((r) => ({
      type: "Pemain",
      label: r.name,
      sub: r.reg,
      href: `/registry/pemain/${r.id}`,
    })),
    ...cl.map((r) => ({
      type: "Klub",
      label: r.name,
      sub: r.short,
      href: `/registry/klub/${r.id}`,
    })),
    ...tn.map((r) => ({
      type: "Turnamen",
      label: r.name,
      sub: "",
      href: `/kompetisi/${r.id}`,
    })),
    ...rf.map((r) => ({
      type: "Wasit",
      label: r.name,
      sub: "",
      href: `/registry/wasit/${r.id}`,
    })),
    ...co.map((r) => ({
      type: "Pelatih",
      label: r.name,
      sub: r.level,
      href: `/registry/pelatih/${r.id}`,
    })),
    ...vn.map((r) => ({
      type: "Venue",
      label: r.name,
      sub: "",
      href: `/registry/venue/${r.id}`,
    })),
  ];

  return NextResponse.json({ results });
}
