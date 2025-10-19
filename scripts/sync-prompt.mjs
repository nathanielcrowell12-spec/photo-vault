#!/usr/bin/env node

/**
 * PhotoVault Prompt Sync Script
 * Syncs the latest prompt from Helm Project registry
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
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

async function syncPrompt() {
  try {
    log('🔄 Syncing prompt from Helm Project...', 'blue')
    
    // Path to Helm's export.local.json
    const helmPath = resolve(__dirname, '../../../Helm Project/prompt-registry/export.local.json')
    
    // Check if Helm export exists
    let data
    try {
      const helmData = readFileSync(helmPath, 'utf8')
      data = JSON.parse(helmData)
    } catch (error) {
      log('❌ Could not read Helm export. Make sure Helm Project is set up.', 'red')
      log(`   Expected path: ${helmPath}`, 'yellow')
      process.exit(1)
    }
    
    // Write prompt to PhotoVault
    const promptPath = resolve(__dirname, '../src/prompt/PROMPT.md')
    const manifestPath = resolve(__dirname, '../src/prompt/manifest.json')
    
    writeFileSync(promptPath, data.prompt)
    writeFileSync(manifestPath, JSON.stringify({
      version: data.version,
      hash: data.hash,
      updated_at: data.updated_at,
      source: data.source
    }, null, 2))
    
    // Update .env.local
    const envPath = resolve(__dirname, '../.env.local')
    let envContent = ''
    try {
      envContent = readFileSync(envPath, 'utf8')
    } catch (error) {
      // .env.local doesn't exist, create it
    }
    
    // Update or add prompt version and hash
    const lines = envContent.split('\n')
    let updatedLines = []
    let versionUpdated = false
    let hashUpdated = false
    
    for (const line of lines) {
      if (line.startsWith('PROMPT_VERSION=')) {
        updatedLines.push(`PROMPT_VERSION=${data.version}`)
        versionUpdated = true
      } else if (line.startsWith('PROMPT_HASH=')) {
        updatedLines.push(`PROMPT_HASH=${data.hash}`)
        hashUpdated = true
      } else {
        updatedLines.push(line)
      }
    }
    
    if (!versionUpdated) {
      updatedLines.push(`PROMPT_VERSION=${data.version}`)
    }
    if (!hashUpdated) {
      updatedLines.push(`PROMPT_HASH=${data.hash}`)
    }
    
    writeFileSync(envPath, updatedLines.join('\n'))
    
    log('✅ Prompt sync complete!', 'green')
    log(`   Version: ${data.version}`, 'green')
    log(`   Hash: ${data.hash}`, 'green')
    log(`   Updated: ${data.updated_at}`, 'green')
    
  } catch (error) {
    log(`❌ Prompt sync failed: ${error.message}`, 'red')
    process.exit(1)
  }
}

syncPrompt()
