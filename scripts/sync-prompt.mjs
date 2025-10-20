#!/usr/bin/env node

/**
 * PhotoVault Prompt Synchronization Script
 * Implements Master Build System Spec v4.3 governance
 * Syncs the latest Master Build Prompt from Helm Project
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { createHash } from 'crypto'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`)
}

// Helm Project paths
const HELM_PROJECT_PATH = resolve(__dirname, '../../../Helm Project')
const PROMPT_SOURCE = join(HELM_PROJECT_PATH, 'docs', 'build', 'MASTER_BUILD_PROMPT_v4.3.txt')
const MANIFEST_SOURCE = join(HELM_PROJECT_PATH, 'prompt-registry', 'manifest.json')
const EXPORT_SOURCE = join(HELM_PROJECT_PATH, 'prompt-registry', 'export.local.json')

// PhotoVault paths
const PHOTOVAULT_PROMPT_DIR = resolve(__dirname, '../src/prompt')
const PROMPT_DEST = join(PHOTOVAULT_PROMPT_DIR, 'PROMPT.md')
const MANIFEST_DEST = join(PHOTOVAULT_PROMPT_DIR, 'manifest.json')
const ENV_LOCAL = resolve(__dirname, '../.env.local')

async function syncPrompt() {
  try {
    log('🔄 Syncing Master Build Prompt from Helm Project (MBP v4.3)...', 'blue')
    
    let data
    
    // Try multiple sources in order of preference
    if (existsSync(PROMPT_SOURCE) && existsSync(MANIFEST_SOURCE)) {
      log('📋 Using direct prompt and manifest files', 'yellow')
      
      // Read prompt content
      const promptContent = readFileSync(PROMPT_SOURCE, 'utf8')
      
      // Extract content between markers if they exist
      const beginMarker = '<<<BEGIN PROMPT>>>'
      const endMarker = '<<<END PROMPT>>>'
      
      let promptBody
      const beginIndex = promptContent.indexOf(beginMarker)
      const endIndex = promptContent.indexOf(endMarker)
      
      if (beginIndex !== -1 && endIndex !== -1) {
        promptBody = promptContent.substring(
          beginIndex + beginMarker.length,
          endIndex
        ).trim()
      } else {
        log('⚠️  Prompt markers not found, using entire content', 'yellow')
        promptBody = promptContent.trim()
      }
      
      // Read manifest
      const manifestContent = readFileSync(MANIFEST_SOURCE, 'utf8')
      const manifest = JSON.parse(manifestContent)
      
      // Compute hash of prompt body (normalized per MBP v4.3 spec)
      const normalizedPrompt = promptBody
        .split('\n')
        .map(line => line.replace(/\s+$/, '')) // Strip trailing spaces
        .join('\n')
      
      const computedHash = createHash('sha256')
        .update(normalizedPrompt, 'utf8')
        .digest('hex')
      
      log(`📋 Prompt Version: ${manifest.version}`, 'blue')
      log(`🔐 Stored Hash: ${manifest.hash}`, 'blue')
      log(`🔐 Computed Hash: ${computedHash}`, 'blue')
      
      // Verify hash matches
      if (manifest.hash !== computedHash) {
        log('❌ Hash mismatch! Prompt may be corrupted or modified.', 'red')
        log(`   Expected: ${manifest.hash}`, 'red')
        log(`   Computed: ${computedHash}`, 'red')
        log('🚫 Deployment blocked due to hash mismatch', 'red')
        process.exit(1)
      }
      
      log('✅ Hash verification passed', 'green')
      
      data = {
        prompt: promptBody,
        version: manifest.version,
        hash: manifest.hash,
        updated_at: manifest.updated_at,
        source: manifest.source
      }
      
    } else if (existsSync(EXPORT_SOURCE)) {
      log('📦 Using Helm export file', 'yellow')
      
      const helmData = readFileSync(EXPORT_SOURCE, 'utf8')
      data = JSON.parse(helmData)
      
    } else {
      log('❌ No Helm Project sources found', 'red')
      log(`   Checked paths:`, 'yellow')
      log(`   - ${PROMPT_SOURCE}`, 'yellow')
      log(`   - ${MANIFEST_SOURCE}`, 'yellow')
      log(`   - ${EXPORT_SOURCE}`, 'yellow')
      
      // Fallback to local manifest if available
      if (existsSync(MANIFEST_DEST)) {
        log('🔄 Attempting fallback to local manifest...', 'yellow')
        const localManifest = JSON.parse(readFileSync(MANIFEST_DEST, 'utf8'))
        log(`📊 Local Version: ${localManifest.version}`, 'yellow')
        log(`🔐 Local Hash: ${localManifest.hash}`, 'yellow')
        log('⚠️  Using cached prompt - sync when Helm is available', 'yellow')
        process.exit(0)
      }
      
      process.exit(1)
    }
    
    // Ensure prompt directory exists
    if (!existsSync(PHOTOVAULT_PROMPT_DIR)) {
      log('📁 Creating prompt directory...', 'yellow')
      const fs = await import('fs')
      fs.mkdirSync(PHOTOVAULT_PROMPT_DIR, { recursive: true })
    }
    
    // Write prompt file
    writeFileSync(PROMPT_DEST, data.prompt)
    log(`✅ Prompt synced to: ${PROMPT_DEST}`, 'green')
    
    // Create venture-specific manifest
    const ventureManifest = {
      version: data.version,
      algo: 'sha256',
      hash: data.hash,
      updated: data.updated_at,
      source: data.source,
      issuer: 'Helm AI Steward',
      ventures: {
        'photovault-hub': {
          synced: new Date().toISOString(),
          verified: true,
          last_check: new Date().toISOString()
        }
      }
    }
    
    // Write manifest
    writeFileSync(MANIFEST_DEST, JSON.stringify(ventureManifest, null, 2))
    log(`✅ Manifest synced to: ${MANIFEST_DEST}`, 'green')
    
    // Update .env.local with prompt version and hash
    let envContent = ''
    if (existsSync(ENV_LOCAL)) {
      envContent = readFileSync(ENV_LOCAL, 'utf8')
    }
    
    // Update or add prompt version and hash
    const lines = envContent.split('\n')
    let promptVersionUpdated = false
    let promptHashUpdated = false
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('PROMPT_VERSION=')) {
        lines[i] = `PROMPT_VERSION=${data.version}`
        promptVersionUpdated = true
      }
      if (lines[i].startsWith('PROMPT_HASH=')) {
        lines[i] = `PROMPT_HASH=${data.hash}`
        promptHashUpdated = true
      }
    }
    
    if (!promptVersionUpdated) {
      lines.push(`PROMPT_VERSION=${data.version}`)
    }
    if (!promptHashUpdated) {
      lines.push(`PROMPT_HASH=${data.hash}`)
    }
    
    writeFileSync(ENV_LOCAL, lines.join('\n'))
    log(`✅ Environment variables updated in: ${ENV_LOCAL}`, 'green')
    
    log('\n🎉 Prompt synchronization completed successfully!', 'green')
    log(`📊 Version: ${data.version}`, 'green')
    log(`🔐 Hash: ${data.hash}`, 'green')
    log(`📅 Updated: ${data.updated_at}`, 'green')
    log(`🏢 Venture: photovault-hub`, 'green')
    
  } catch (error) {
    log(`❌ Sync failed: ${error.message}`, 'red')
    log('🔄 Check Helm Project availability and try again', 'yellow')
    process.exit(1)
  }
}

syncPrompt()