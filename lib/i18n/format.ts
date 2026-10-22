import { INTL_LOCALE, type Locale } from "./config";

/**
 * Every date is shown in WIB regardless of where the code runs. Without this a
 * server in UTC (Hostinger) would render kick-off times 7 hours early, and the
 * browser could disagree with the server on hydration.
 */
export const APP_TIME_ZONE = "Asia/Jakarta";

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000000],
  ["month", 2592000000],
  ["day", 86400000],
  ["hour", 3600000],
  ["minute", 60000],
  ["second", 1000],
];

export type Formatters = ReturnType<typeof makeFormatters>;

/** Date, number and currency formatting bound to one language. */
export function makeFormatters(locale: Locale) {
  const tag = INTL_LOCALE[locale];

  const number = (n: number, opts?: Intl.NumberFormatOptions) => new Intl.NumberFormat(tag, opts).format(n);

  return {
    locale,
    tag,
    date(date: Date | string | number, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
      return new Intl.DateTimeFormat(tag, { timeZone: APP_TIME_ZONE, ...opts }).format(new Date(date));
    },
    dateTime(date: Date | string | number) {
      return new Intl.DateTimeFormat(tag, {
        timeZone: APP_TIME_ZONE,
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(date));
    },
    time(date: Date | string | number) {
      return new Intl.DateTimeFormat(tag, {
        timeZone: APP_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(date));
    },
    number,
    /** Always "Rp", also in English — `Intl` would print "IDR" there. */
    rupiah(n: number) {
      return `Rp ${number(n, { maximumFractionDigits: 0 })}`;
    },
    relative(date: Date | string | number) {
      const diff = new Date(date).getTime() - Date.now();
      const abs = Math.abs(diff);
      const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
      for (const [unit, ms] of RELATIVE_UNITS) {
        if (abs >= ms || unit === "second") return rtf.format(Math.round(diff / ms), unit);
      }
      return "";
    },
  };
}
