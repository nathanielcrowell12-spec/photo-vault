'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Activity, Users, Database, TrendingUp } from 'lucide-react'
import { helmSyncService } from '@/lib/services/helm-sync-service'

interface HelmProjectStatusProps {
  className?: string
}

interface SystemHealth {
  status: string
  overall_uptime: number
  services: Array<{
    service: string
    status: string
    uptime: number
    response_time: number
  }>
  timestamp: string
}

interface AutonomyMetrics {
  status: string
  phase: number
  autonomy_level: string
  metrics: Array<{
    process_name: string
    current_phase: number
    composite_confidence_score: number
    human_intervention_rate: number
  }>
  summary: {
    total_processes: number
    phase_1_processes: number
    avg_human_intervention: number
    readiness_for_phase_2: string
  }
}

export function HelmProjectStatus({ className }: HelmProjectStatusProps) {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [autonomyMetrics, setAutonomyMetrics] = useState<AutonomyMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHelmProjectStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const status = await helmSyncService.getHelmProjectStatus()
      setSystemHealth(status.systemHealth)
      setAutonomyMetrics(status.autonomyMetrics)
    } catch (err) {
      setError('Failed to fetch Helm Project status')
      console.error('Error fetching Helm Project status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setLoading(true)
    try {
      await helmSyncService.syncWithHelmProject()
      await fetchHelmProjectStatus()
    } catch (err) {
      setError('Failed to sync with Helm Project')
      console.error('Error syncing with Helm Project:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHelmProjectStatus()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'bg-green-500'
      case 'degraded':
        return 'bg-yellow-500'
      case 'down':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'Healthy'
      case 'degraded':
        return 'Degraded'
      case 'down':
        return 'Down'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Helm Project Status
              </CardTitle>
              <CardDescription>
                Mission Control Dashboard Connection
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Sync
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {systemHealth && (
            <div className="space-y-4">
              {/* System Health */}
              <div>
                <h4 className="font-medium mb-2">System Health</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Overall Status</span>
                    <Badge className={getStatusColor(systemHealth.status)}>
                      {getStatusText(systemHealth.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm font-mono">{systemHealth.overall_uptime}%</span>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <h4 className="font-medium mb-2">Services</h4>
                <div className="space-y-2">
                  {systemHealth.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(service.status)}`} />
                        <span className="text-sm font-medium">{service.service}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>{service.uptime}% uptime</span>
                        <span>{service.response_time}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Autonomy Metrics */}
              {autonomyMetrics && (
                <div>
                  <h4 className="font-medium mb-2">Autonomy Metrics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Database className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Phase</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {autonomyMetrics.phase}
                      </span>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Processes</span>
                      </div>
                      <span className="text-lg font-bold text-purple-600">
                        {autonomyMetrics.summary.total_processes}
                      </span>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Intervention</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {autonomyMetrics.summary.avg_human_intervention}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Last Updated */}
              <div className="text-xs text-gray-500 text-center">
                Last updated: {new Date(systemHealth.timestamp).toLocaleString()}
              </div>
            </div>
          )}

          {!systemHealth && !error && (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No Helm Project data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
