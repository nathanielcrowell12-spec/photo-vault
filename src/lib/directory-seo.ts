/**
 * Title construction for the directory location pages.
 *
 * The 2026-08-07 on-page crawl found 40 titles over 65 characters, nearly all from
 * one template: `{Location} - Photography Location in {City} | PhotoVault Directory`,
 * which ran 66-110 chars. Google truncates around 60.
 *
 * Strategic note: these pages target ~10 searches/month at $0.00 CPC (Phase 1/2
 * research). This is a correctness fix, not a traffic lever — do not mistake it for one.
 */

export const TITLE_MAX = 60

export interface LocationTitleInput {
  name: string
  city: string
  state?: string | null
}

export function buildLocationTitle({ name, city, state }: LocationTitleInput): string {
  // Shed detail in order of least value first. "Photos" is kept longer than the
  // city because it is the actual query term — Phase 1 research found the real
  // searches are "olbrich botanical gardens photos" (170/mo), not "<place> madison".
  const candidates = [
    state ? `${name} Photos — ${city}, ${state} | PhotoVault` : null,
    `${name} Photos — ${city} | PhotoVault`,
    `${name} Photos | PhotoVault`,
    `${name} | PhotoVault`,
  ].filter((c): c is string => c !== null)

  // Last entry is the floor: a location name longer than the limit cannot be fixed
  // by templating, and truncating a proper noun is worse than a long title.
  return candidates.find((c) => c.length <= TITLE_MAX) ?? candidates[candidates.length - 1]
}
