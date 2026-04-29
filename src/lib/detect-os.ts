export type DesktopOS = 'windows' | 'mac' | 'linux' | 'unknown'

interface UserAgentData {
  platform?: string
}

export function detectOSFromHints(
  platformHint: string | undefined,
  userAgent: string | undefined
): DesktopOS {
  const p = (platformHint ?? '').toLowerCase()
  if (p.includes('win')) return 'windows'
  if (p.includes('mac')) return 'mac'
  if (p.includes('linux')) return 'linux'

  const ua = (userAgent ?? '').toLowerCase()
  // Check Mac before Windows: Safari UAs include "Macintosh"; some Mac UAs may contain "win" substrings.
  if (ua.includes('mac')) return 'mac'
  if (ua.includes('win')) return 'windows'
  if (ua.includes('linux') || ua.includes('x11')) return 'linux'

  return 'unknown'
}

export function detectOS(): DesktopOS {
  if (typeof navigator === 'undefined') return 'unknown'
  const uaData = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData
  return detectOSFromHints(uaData?.platform, navigator.userAgent)
}
