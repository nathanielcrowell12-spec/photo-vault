'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'

export function IncomeCalculator() {
  const [clientCount, setClientCount] = useState(20)
  const monthlyRevenue = clientCount * 4

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <p className="text-sm font-medium text-gray-700">INCOME POTENTIAL CALCULATOR</p>

      <div className="mt-2 mb-4">
        <label htmlFor="clients-slider" className="text-sm text-gray-700 font-medium">
          Number of paying clients:
        </label>
        <div className="flex items-center gap-4 mt-2">
          <Slider
            id="clients-slider"
            min={0}
            max={100}
            step={1}
            value={[clientCount]}
            onValueChange={(value) => setClientCount(value[0])}
            className="flex-1"
          />
          <span className="text-lg font-semibold text-[#1a365d] min-w-[3rem] text-right">
            {clientCount}
          </span>
        </div>
      </div>

      <div className="mt-4 text-4xl font-bold text-amber-500">
        ${monthlyRevenue}
        <span className="text-2xl text-gray-700">/month</span>
      </div>
      <p className="mt-1 text-sm text-slate-500">Passive recurring revenue</p>

      <Button asChild className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-white px-6 py-4 h-auto text-lg font-semibold">
        <Link href="/photographers/signup">
          Start Protecting Memories - $22/Month
        </Link>
      </Button>

      <p className="mt-3 text-xs text-slate-500">
        Based on an average of 42 sessions a year. Adjust the slider to see your potential.
      </p>
    </div>
  )
}
