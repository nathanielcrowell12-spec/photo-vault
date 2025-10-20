#!/usr/bin/env node

/**
 * PhotoVault Prompt Verification Script
 * Implements Master Build System Spec v4.3 governance
 * Verifies the integrity of the Master Build Prompt
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createHash } from 'crypto'

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

async function verifyPrompt() {
  try {
    log('🔐 Verifying prompt integrity (MBP v4.3)...', 'blue')
    
    const promptPath = resolve(__dirname, '../src/prompt/PROMPT.md')
    const manifestPath = resolve(__dirname, '../src/prompt/manifest.json')
    const envPath = resolve(__dirname, '../.env.local')
    
    // Check if files exist
    if (!existsSync(promptPath)) {
      log('❌ Prompt file not found', 'red')
      log(`   Expected: ${promptPath}`, 'yellow')
      log('💡 Run "npm run prompt:sync" to sync from Helm Project', 'yellow')
      process.exit(1)
    }
    
    if (!existsSync(manifestPath)) {
      log('❌ Manifest file not found', 'red')
      log(`   Expected: ${manifestPath}`, 'yellow')
      log('💡 Run "npm run prompt:sync" to sync from Helm Project', 'yellow')
      process.exit(1)
    }
    
    // Read files
    const promptContent = readFileSync(promptPath, 'utf8')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    
    // Normalize prompt content per MBP v4.3 spec
    const normalizedPrompt = promptContent
      .split('\n')
      .map(line => line.replace(/\s+$/, '')) // Strip trailing spaces
      .join('\n')
    
    // Compute hash using SHA-256
    const computedHash = createHash('sha256')
      .update(normalizedPrompt, 'utf8')
      .digest('hex')
    
    log(`📋 Version: ${manifest.version}`, 'blue')
    log(`🔐 Stored Hash: ${manifest.hash}`, 'blue')
    log(`🔐 Computed Hash: ${computedHash}`, 'blue')
    log(`📅 Updated: ${manifest.updated ?? manifest.updated_at}`, 'blue')
    log(`🏢 Venture: photovault-hub`, 'blue')
    
    // Verify hash matches
    if (manifest.hash !== computedHash) {
      log('❌ Hash mismatch! Prompt integrity check failed', 'red')
      log(`   Expected: ${manifest.hash}`, 'red')
      log(`   Computed: ${computedHash}`, 'red')
      log('🚫 Deployment blocked due to hash mismatch', 'red')
      log('💡 Run "npm run prompt:sync" to get latest prompt', 'yellow')
      process.exit(1)
    }
    
    // Check environment variables
    let envIssues = []
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf8')
      const hasVersion = envContent.includes(`PROMPT_VERSION=${manifest.version}`)
      const hasHash = envContent.includes(`PROMPT_HASH=${manifest.hash}`)
      
      if (!hasVersion) {
        envIssues.push('PROMPT_VERSION not up to date')
      }
      if (!hasHash) {
        envIssues.push('PROMPT_HASH not up to date')
      }
    } else {
      envIssues.push('Environment file not found')
    }
    
    if (envIssues.length > 0) {
      log('⚠️  Environment variable issues:', 'yellow')
      envIssues.forEach(issue => log(`   • ${issue}`, 'yellow'))
      log('💡 Run "npm run prompt:sync" to update', 'yellow')
    }
    
    // Success!
    log('✅ Prompt verification passed!', 'green')
    log(`   Version: ${manifest.version}`, 'green')
    log(`   Hash: ${manifest.hash}`, 'green')
    log(`   Source: ${manifest.source}`, 'green')
    log(`   Issuer: ${manifest.issuer}`, 'green')
    log('   ✅ Integrity check passed', 'green')
    log('   ✅ Governance compliance verified', 'green')
    
  } catch (error) {
    log(`❌ Verification failed: ${error.message}`, 'red')
    process.exit(1)
  }
}

verifyPrompt()