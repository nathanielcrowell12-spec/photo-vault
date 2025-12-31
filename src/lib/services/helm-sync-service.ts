/**
 * Helm Project Sync Service
 * Automatically syncs Photo Vault data with Helm Project (Mission Control)
 */

import { helmClient } from '@/lib/helm-client'
import { logger } from '../logger'

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

    logger.info('[HelmSyncService] Starting sync service...')
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
    logger.info('[HelmSyncService] Sync service stopped')
  }

  /**
   * Manually sync with Helm Project
   */
  async syncWithHelmProject(): Promise<void> {
    try {
      logger.info('[HelmSyncService] Syncing with Helm Project...')
      
      // First check if Helm Project is available
      const healthResponse = await fetch('/api/helm/health', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      })

      if (!healthResponse.ok) {
        logger.info('[HelmSyncService] Helm Project not available, skipping sync')
        return
      }
      
      // Send metrics to Helm Project
      const response = await fetch('/api/helm/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) {
        logger.warn(`[HelmSyncService] Sync failed with status ${response.status}, continuing without sync`)
        return
      }

      const result = await response.json()
      logger.info('[HelmSyncService] Sync successful:', result.message)

    } catch (error) {
      logger.warn('[HelmSyncService] Sync failed (non-critical):', error instanceof Error ? error.message : 'Unknown error')
      // Don't throw the error - this is a non-critical operation
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
      logger.error('[HelmSyncService] Failed to get status:', error)
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

// Auto-start in browser environment - TEMPORARILY DISABLED
// if (typeof window !== 'undefined') {
//   helmSyncService.start()
// }
