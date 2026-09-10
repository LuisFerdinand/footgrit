/**
 * Next.js `redirect()` / `notFound()` throw control-flow errors that MUST
 * propagate. When calling a server action from a client transition, rethrow
 * these so navigation still happens.
 */
export function rethrowControlFlow(e: unknown): void {
  const digest = (e as { digest?: string } | null)?.digest;
  if (typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND")) {
    throw e;
  }
}
