import { Users, Accessibility, Car, Plane, Coffee } from 'lucide-react'
import type { LocationBusinessIntelligence } from '@/types/directory'

interface QuickStatsBarProps {
  intel: LocationBusinessIntelligence | null
}

interface StatItem {
  icon: React.ReactNode
  label: string
  value: string
}

export function QuickStatsBar({ intel }: QuickStatsBarProps) {
  if (!intel) return null

  const stats: StatItem[] = []

  if (intel.crowd_level) {
    stats.push({ icon: <Users className="w-4 h-4" />, label: 'Crowds', value: intel.crowd_level })
  }
  if (intel.accessibility) {
    stats.push({ icon: <Accessibility className="w-4 h-4" />, label: 'Accessibility', value: intel.accessibility })
  }
  if (intel.parking) {
    stats.push({ icon: <Car className="w-4 h-4" />, label: 'Parking', value: intel.parking })
  }
  if (intel.drone_policy) {
    stats.push({ icon: <Plane className="w-4 h-4" />, label: 'Drones', value: intel.drone_policy })
  }
  if (intel.amenities) {
    stats.push({ icon: <Coffee className="w-4 h-4" />, label: 'Amenities', value: intel.amenities })
  }

  if (stats.length === 0) return null

  return (
    <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-card p-4 mb-8">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-start gap-2 min-w-[140px] flex-1">
          <div className="text-amber-500 mt-0.5 shrink-0">{stat.icon}</div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-sm text-foreground">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
