'use client'

import { useState } from 'react'
import { Slider } from '@/components/ui/slider'

const REFERENCE_POINTS = [
  { clients: 10, income: 40 },
  { clients: 25, income: 100 },
  { clients: 50, income: 200 },
  { clients: 100, income: 400 },
]

export function IncomeCalculator() {
  const [clientCount, setClientCount] = useState(20)
  const monthlyRevenue = clientCount * 4

  return (
    <div className="bg-card p-4 sm:p-6 rounded-lg border border-border">
      <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Income Calculator
      </p>

      <div className="mt-3 mb-3 sm:mb-4">
        <label htmlFor="clients-slider" className="text-xs sm:text-sm text-foreground font-medium">
          Number of paying clients:
        </label>
        <div className="flex items-center gap-3 sm:gap-4 mt-2">
          <Slider
            id="clients-slider"
            min={0}
            max={100}
            step={1}
            value={[clientCount]}
            onValueChange={(value) => setClientCount(value[0])}
            className="flex-1"
            aria-label="Number of paying clients"
          />
          <span className="text-base sm:text-lg font-semibold text-foreground min-w-[2.5rem] sm:min-w-[3rem] text-right">
            {clientCount}
          </span>
        </div>
      </div>

      <div className="mt-3 sm:mt-4 text-2xl sm:text-4xl font-bold text-primary">
        ${monthlyRevenue}
        <span className="text-lg sm:text-2xl text-muted-foreground">/month</span>
      </div>
      <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
        Passive recurring revenue
      </p>

      {/* Reference points */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        {REFERENCE_POINTS.map(({ clients, income }) => (
          <span key={clients}>
            {clients} clients = ${income}/mo
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Most photographers shoot 30-50 clients per year. In 2-3 years, that&apos;s real income.
      </p>
    </div>
  )
}
