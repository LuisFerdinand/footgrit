/**
 * Redirect helpers shared by the proxy, the login server action and the login form.
 * Pure functions with no Node/DB imports, so they are safe in every runtime.
 */

/** Where each kind of account starts after signing in. */
export function landingFor(role: string | null | undefined) {
  return role === "coach" ? "/dsp" : role === "unit_bisnis" ? "/keuangan" : "/command-center";
}

const PLACEHOLDER_ORIGIN = "http://same-origin.invalid";

/**
 * Accepts a post-login target only when it is a same-origin, relative app path.
 * Returns `null` for anything else, so callers fall back to the role landing page:
 *
 *   "/kompetisi?status=live"  → ok
 *   "//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "/%0d%0a…" → null
 *
 * The login page itself and `/api/*` are rejected too (a `next` pointing at them would loop
 * or land on raw JSON). The fragment is dropped.
 */
export function safeNextPath(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) return null;
  // Must be a rooted path. Browsers treat "\" like "/", so "/\evil.com" is protocol-relative.
  if (raw[0] !== "/" || raw[1] === "/" || raw[1] === "\\") return null;
  // Control characters (CR/LF, tab, NUL…) and backslashes never belong in an app path.
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return null;

  let url: URL;
  try {
    url = new URL(raw, PLACEHOLDER_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return null;

  // A decoded path can still smuggle a second slash ("/%2F/evil.com" is harmless as a path,
  // but "//" after decoding is refused anyway so nothing downstream can mistake it for a host).
  let decoded: string;
  try {
    decoded = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  if (decoded.startsWith("//") || decoded.includes("\\")) return null;

  const path = url.pathname;
  if (path === "/login" || path.startsWith("/login/")) return null;
  if (path === "/api" || path.startsWith("/api/")) return null;

  return path + url.search;
}
