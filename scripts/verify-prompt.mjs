#!/usr/bin/env node

/**
 * PhotoVault Prompt Verification Script
 * Verifies that the current prompt matches the expected hash
 */

import { readFileSync } from 'fs'
import { createHash } from 'crypto'
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

async function verifyPrompt() {
  try {
    log('🔍 Verifying prompt integrity...', 'blue')
    
    // Read environment variables
    const envPath = resolve(__dirname, '../.env.local')
    let expectedHash = ''
    let expectedVersion = ''
    
    try {
      const envContent = readFileSync(envPath, 'utf8')
      const lines = envContent.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('PROMPT_HASH=')) {
          expectedHash = line.split('=')[1]
        } else if (line.startsWith('PROMPT_VERSION=')) {
          expectedVersion = line.split('=')[1]
        }
      }
    } catch (error) {
      log('⚠️  No .env.local found. Run sync-prompt first.', 'yellow')
      process.exit(1)
    }
    
    if (!expectedHash || !expectedVersion) {
      log('❌ Missing PROMPT_HASH or PROMPT_VERSION in .env.local', 'red')
      log('   Run: npm run prompt:sync', 'yellow')
      process.exit(1)
    }
    
    // Read current prompt
    const promptPath = resolve(__dirname, '../src/prompt/PROMPT.md')
    let currentPrompt = ''
    
    try {
      currentPrompt = readFileSync(promptPath, 'utf8')
    } catch (error) {
      log('❌ Could not read PROMPT.md. Run sync-prompt first.', 'red')
      process.exit(1)
    }
    
    // Compute hash of current prompt
    const actualHash = createHash('sha256').update(currentPrompt).digest('hex')
    
    // Compare hashes
    if (actualHash === expectedHash) {
      log('✅ Prompt verified successfully!', 'green')
      log(`   Version: ${expectedVersion}`, 'green')
      log(`   Hash: ${actualHash}`, 'green')
      log('   ✅ Integrity check passed', 'green')
    } else {
      log('❌ Prompt hash mismatch!', 'red')
      log(`   Expected: ${expectedHash}`, 'red')
      log(`   Actual:   ${actualHash}`, 'red')
      log('   Run: npm run prompt:sync', 'yellow')
      process.exit(1)
    }
    
  } catch (error) {
    log(`❌ Prompt verification failed: ${error.message}`, 'red')
    process.exit(1)
  }
}

verifyPrompt()
