'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { CompetitorLogo } from '@/lib/competitor-logos'

interface CompetitorLogosProps {
  className?: string
  showUpdateButton?: boolean
  onPlatformClick?: (platformName: string) => void
  showOtherOption?: boolean
  showImportButton?: boolean
}

export default function CompetitorLogos({ 
  className = '', 
  showUpdateButton = false,
  onPlatformClick,
  showOtherOption = false,
  showImportButton = true
}: CompetitorLogosProps) {
  const [logos, setLogos] = useState<CompetitorLogo[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  // Fetch competitor logos
  const fetchLogos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/competitor-logos')
      const data = await response.json()
      
      if (data.success) {
        setLogos(data.logos)
        setLastUpdated(data.logos[0]?.lastUpdated || '')
      }
    } catch (error) {
      console.error('Error fetching competitor logos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Force update logos (admin function)
  const updateLogos = async () => {
    try {
      setUpdating(true)
      const response = await fetch('/api/competitor-logos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      
      if (data.success) {
        setLogos(data.logos)
        setLastUpdated(data.updatedAt)
        console.log('✅ Competitor logos updated successfully')
      }
    } catch (error) {
      console.error('Error updating competitor logos:', error)
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    fetchLogos()
  }, [])

  if (loading) {
    return (
      <div className={`grid md:grid-cols-4 gap-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 text-center">
              <div className="h-12 bg-secondary rounded mb-2"></div>
              <div className="h-4 bg-secondary rounded mb-2"></div>
              <div className="h-6 bg-secondary rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Update button for admins */}
      {showUpdateButton && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Never'}</span>
          </div>
          <Button 
            onClick={updateLogos} 
            disabled={updating}
            size="sm"
            variant="outline"
            className="btn-outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
            {updating ? 'Updating...' : 'Update Logos'}
          </Button>
        </div>
      )}

      {/* Competitor logos grid */}
      <div className="grid md:grid-cols-4 gap-4">
        {logos.map((logo, index) => {
          const CardWrapper = onPlatformClick ? 'div' : Link
          const wrapperProps = onPlatformClick 
            ? { onClick: () => onPlatformClick(logo.name), className: "block cursor-pointer" }
            : { href: "/client/import", className: "block" }

          return (
            <CardWrapper 
              key={logo.id}
              {...wrapperProps}
            >
              <Card 
                className={`cursor-pointer card-shadow-hover border border-border group transition-all hover:scale-105 ${
                  logo.name === 'Pic-Time' 
                    ? 'hover:border-primary' 
                    : 'border-green-200 bg-green-50/50 dark:bg-green-900/10'
                }`}
              >
                <CardContent className="p-4 text-center">
                  {/* Logo Image */}
                  <div className="relative h-12 mb-3 overflow-hidden rounded">
                    <img 
                      src={logo.logoUrl} 
                      alt={`${logo.name} logo`}
                      loading="lazy"
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        // Fallback to a generic logo if image fails to load
                        e.currentTarget.src = `https://via.placeholder.com/200x60/00B3A4/FFFFFF?text=${logo.name}`
                      }}
                    />
                  </div>

                  {/* Platform Name */}
                  <h3 className="font-semibold mb-2 text-foreground text-sm">{logo.name}</h3>

                  {/* Status Badge */}
                  <Badge 
                    className={`text-xs ${
                      logo.name === 'Pic-Time'
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}
                  >
                    {logo.name === 'Pic-Time' ? (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Ready to Import
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </>
                    )}
                  </Badge>
                </CardContent>
              </Card>
            </CardWrapper>
          )
        })}
        
        {/* "Other Platform" Option */}
        {showOtherOption && (
          <div
            onClick={() => onPlatformClick?.('Other')}
            className="block cursor-pointer"
          >
            <Card className="cursor-pointer card-shadow-hover border border-dashed border-border group transition-all hover:scale-105 hover:border-primary">
              <CardContent className="p-4 text-center">
                <div className="relative h-12 mb-3 flex items-center justify-center">
                  <div className="text-4xl">🔗</div>
                </div>
                <h3 className="font-semibold mb-2 text-foreground text-sm">Other Platform</h3>
                <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                  <Clock className="h-3 w-3 mr-1" />
                  Custom Connection
                </Badge>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Import button */}
      {showImportButton && (
        <div className="mt-6 text-center">
          <Button asChild className="btn-primary">
            <Link href="/client/import">
              <Download className="h-4 w-4 mr-2" />
              Import More Photos
            </Link>
          </Button>
        </div>
      )}

      {/* Auto-update info */}
      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          🔄 Competitor logos automatically update every 2 months to stay current
        </p>
      </div>
    </div>
  )
}
