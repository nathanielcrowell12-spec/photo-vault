import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  DollarSign,
  AlertTriangle,
  Lightbulb,
  Calendar,
  Ticket,
  BookOpen,
  ArrowRight,
  User,
  Briefcase,
} from 'lucide-react'
import type { LocationBusinessIntelligence } from '@/types/directory'

interface IntelCardProps {
  intel: LocationBusinessIntelligence | null
}

// --- PermitCard ---

export function PermitCard({ intel }: IntelCardProps) {
  if (!intel) return null

  const hasNewFields = intel.permit_personal || intel.permit_pro
  const hasLegacyFields = intel.permit_status || intel.permit_cost || intel.permit_details

  if (!hasNewFields && !hasLegacyFields) return null

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-500" />
          Permit Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasNewFields ? (
          <>
            {intel.permit_personal && (
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Personal / Portrait</p>
                  <p className="text-sm text-foreground">{intel.permit_personal}</p>
                </div>
              </div>
            )}
            {intel.permit_pro && (
              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Professional / Bridal</p>
                  <p className="text-sm text-foreground">{intel.permit_pro}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {intel.permit_status && (
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Status</p>
                  <p className="text-sm text-foreground">
                    {intel.permit_status === 'Yes' && 'No permit required for small sessions'}
                    {intel.permit_status === 'No' && 'Permit required'}
                    {intel.permit_status === 'Varies' && 'Permit requirements vary — see details'}
                    {intel.permit_status === 'Prohibited' && 'No commercial photography allowed'}
                  </p>
                </div>
              </div>
            )}
            {intel.permit_details && (
              <div className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Details</p>
                  <p className="text-sm text-foreground leading-relaxed">{intel.permit_details}</p>
                </div>
              </div>
            )}
          </>
        )}

        {intel.permit_cost && (
          <div className="flex items-start gap-3">
            <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Cost</p>
              <p className="text-sm text-foreground">{intel.permit_cost}</p>
            </div>
          </div>
        )}

        {intel.admission_notes && (
          <div className="flex items-start gap-3">
            <Ticket className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Admission</p>
              <p className="text-sm text-foreground">{intel.admission_notes}</p>
            </div>
          </div>
        )}

        {intel.booking_info && (
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Booking</p>
              <p className="text-sm text-foreground">{intel.booking_info}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// --- RulesCard ---

export function RulesCard({ intel }: IntelCardProps) {
  if (!intel?.rules_and_restrictions) return null

  const rules = intel.rules_and_restrictions
    .split(/\.\s+|\n/)
    .map((r) => r.trim())
    .filter((r) => r.length > 0)

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Rules & Restrictions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {rules.map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <span className="text-red-400 mt-0.5 shrink-0">&#8226;</span>
              <span>{rule.endsWith('.') ? rule : `${rule}.`}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// --- SeasonalGrid ---

const SEASON_CONFIG = [
  { key: 'spring', label: 'Spring', emoji: '🌸', color: 'text-green-400' },
  { key: 'summer', label: 'Summer', emoji: '☀️', color: 'text-yellow-400' },
  { key: 'fall', label: 'Fall', emoji: '🍂', color: 'text-orange-400' },
  { key: 'winter', label: 'Winter', emoji: '❄️', color: 'text-blue-400' },
] as const

function parseSeasons(text: string): Record<string, string> {
  const seasons: Record<string, string> = {}
  const lower = text.toLowerCase()

  for (const { key } of SEASON_CONFIG) {
    // Match patterns like "Spring: ..." or "Spring — ..." up to the next season/period
    const regex = new RegExp(`${key}[:\\s—]+([^.]+(?:\\.[^A-Z]*)*)`, 'i')
    const match = lower.match(regex)
    if (match) {
      // Get the original-case version
      const startIdx = lower.indexOf(match[0])
      const originalMatch = text.substring(startIdx, startIdx + match[0].length)
      const colonIdx = originalMatch.search(/[:\s—]+/)
      seasons[key] = originalMatch.substring(colonIdx).replace(/^[:\s—]+/, '').trim()
    }
  }

  // Also try to extract general "Best Times" / "Golden hour" / "Avoid" info
  if (Object.keys(seasons).length === 0) {
    // If no season-specific info found, put the whole text under a general key
    seasons['general'] = text
  }

  return seasons
}

export function SeasonalGrid({ intel }: IntelCardProps) {
  if (!intel?.seasonal_availability) return null

  const seasons = parseSeasons(intel.seasonal_availability)
  const hasSeasonData = SEASON_CONFIG.some(({ key }) => seasons[key])

  return (
    <Card className="border-border bg-card md:col-span-2">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          Best Times to Shoot
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasSeasonData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SEASON_CONFIG.map(({ key, label, emoji, color }) => (
              <div
                key={key}
                className="rounded-lg border border-border bg-background p-3 text-center"
              >
                <div className="text-2xl mb-1">{emoji}</div>
                <p className={`text-sm font-semibold ${color} mb-1`}>{label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {seasons[key] || 'No specific notes'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground leading-relaxed">
            {intel.seasonal_availability}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// --- InsiderTipsCard ---

export function InsiderTipsCard({ intel }: IntelCardProps) {
  if (!intel?.insider_tips) return null

  const tips = intel.insider_tips
    .split(/\.\s+|\n/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 md:col-span-2">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          Insider Tips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <ArrowRight className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <span>{tip.endsWith('.') ? tip : `${tip}.`}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
