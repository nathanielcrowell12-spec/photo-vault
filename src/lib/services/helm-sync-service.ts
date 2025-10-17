/**
 * Helm Project Sync Service
 * Automatically syncs Photo Vault data with Helm Project (Mission Control)
 */

import { helmClient } from '@/lib/helm-client'

interface SyncConfig {
  enabled: boolean
  interval: number // in milliseconds
  autoSync: boolean
}

class HelmSyncService {
  private config: SyncConfig
  private syncInterval: NodeJS.Timeout | null = null
  private isRunning = false

  constructor(config: SyncConfig = {
    enabled: true,
    interval: 5 * 60 * 1000, // 5 minutes
    autoSync: true
  }) {
    this.config = config
  }

  /**
   * Start automatic syncing with Helm Project
   */
  start(): void {
    if (!this.config.enabled || this.isRunning) {
      return
    }

    console.log('Starting Helm Project sync service...')
    this.isRunning = true

    // Initial sync
    this.syncWithHelmProject()

    // Set up interval sync
    if (this.config.autoSync) {
      this.syncInterval = setInterval(() => {
        this.syncWithHelmProject()
      }, this.config.interval)
    }
  }

  /**
   * Stop automatic syncing
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    this.isRunning = false
    console.log('Helm Project sync service stopped')
  }

  /**
   * Manually sync with Helm Project
   */
  async syncWithHelmProject(): Promise<void> {
    try {
      console.log('Syncing with Helm Project...')
      
      // Send metrics to Helm Project
      const response = await fetch('/api/helm/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`)
      }

      const result = await response.json()
      console.log('Helm Project sync successful:', result.message)

    } catch (error) {
      console.error('Failed to sync with Helm Project:', error)
    }
  }

  /**
   * Get Helm Project system status
   */
  async getHelmProjectStatus(): Promise<Record<string, unknown>> {
    try {
      const [systemHealth, autonomyMetrics, personaStatus] = await Promise.all([
        helmClient.getSystemHealth(),
        helmClient.getAutonomyMetrics(),
        helmClient.getPersonaStatus()
      ])

      return {
        systemHealth,
        autonomyMetrics,
        personaStatus,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('Failed to get Helm Project status:', error)
      throw error
    }
  }

  /**
   * Update sync configuration
   */
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Restart service if running
    if (this.isRunning) {
      this.stop()
      this.start()
    }
  }

  /**
   * Get current sync status
   */
  getStatus(): {
    isRunning: boolean
    config: SyncConfig
    lastSync?: string
  } {
    return {
      isRunning: this.isRunning,
      config: this.config
    }
  }
}

// Create singleton instance
export const helmSyncService = new HelmSyncService()

// Auto-start in browser environment
if (typeof window !== 'undefined') {
  helmSyncService.start()
}
