/**
 * Helm Project API Client
 * Communication bridge between Photo Vault and Helm Project (Mission Control)
 */

import { logger } from './logger'

interface HelmProjectConfig {
  baseUrl: string
  apiKey?: string
  signals?: {
    prompt_version?: string
    prompt_hash?: string
    tenant_id?: string
  }
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

interface PersonaStatus {
  status: string
  phase: number
  autonomy_level: string
  personas: Array<{
    type: string
    active: boolean
    current_task: string
    confidence_level: number
    last_activity: string
  }>
  collaboration_mode: string
  readiness_for_ai_integration: string
}

export class HelmProjectClient {
  private config: HelmProjectConfig

  constructor(config: HelmProjectConfig) {
    this.config = config
  }

  /**
   * Get system health status from Helm Project
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/system-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        }
      })

      if (!response.ok) {
        throw new Error(`Helm Project API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      logger.error('[HelmClient] Failed to fetch system health:', error)
      throw error
    }
  }

  /**
   * Get autonomy metrics from Helm Project
   */
  async getAutonomyMetrics(): Promise<AutonomyMetrics> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/autonomy/metrics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        }
      })

      if (!response.ok) {
        throw new Error(`Helm Project API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      logger.error('[HelmClient] Failed to fetch autonomy metrics:', error)
      throw error
    }
  }

  /**
   * Get persona status from Helm Project
   */
  async getPersonaStatus(): Promise<PersonaStatus> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/personas/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        }
      })

      if (!response.ok) {
        throw new Error(`Helm Project API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      logger.error('[HelmClient] Failed to fetch persona status:', error)
      throw error
    }
  }

  /**
   * Send Photo Vault metrics to Helm Project
   */
  async sendPhotoVaultMetrics(metrics: {
    revenue: number
    activeUsers: number
    galleriesCount: number
    photosCount: number
    systemLoad: number
  }): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/ventures/photovault/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          venture: 'photovault',
          metrics,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`Helm Project API error: ${response.status}`)
      }
    } catch (error) {
      logger.error('[HelmClient] Failed to send Photo Vault metrics:', error)
      throw error
    }
  }

  /**
   * Send Photo Vault health status to Helm Project
   */
  async sendHealthStatus(status: {
    service: string
    status: 'healthy' | 'degraded' | 'down'
    uptime: number
    response_time: number
    error_message?: string
  }): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/system-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(status)
      })

      if (!response.ok) {
        throw new Error(`Helm Project API error: ${response.status}`)
      }
    } catch (error) {
      logger.error('[HelmClient] Failed to send health status:', error)
      throw error
    }
  }
}

// Default configuration
const defaultConfig: HelmProjectConfig = {
  baseUrl: process.env.NEXT_PUBLIC_HELM_PROJECT_URL || 'http://localhost:3001',
  // MBP v4.3 Signals configuration
  signals: {
    prompt_version: process.env.PROMPT_VERSION || '4.3',
    prompt_hash: process.env.PROMPT_HASH || 'not_set',
    tenant_id: 'photovault-hub',
  },
  apiKey: process.env.HELM_PROJECT_API_KEY
}

// Check if Helm Project is available
const isHelmProjectAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${defaultConfig.baseUrl}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000) // 2 second timeout
    })
    return response.ok
  } catch (error) {
    logger.info('[HelmClient] Helm Project not available:', error)
    return false
  }
}

export const helmClient = new HelmProjectClient(defaultConfig)
