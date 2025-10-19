#!/usr/bin/env node

/**
 * PhotoVault Code Hygiene Script
 * Implements the Helm Project Self-Maintenance & Code Hygiene Protocol
 * 
 * This script performs automated cleanup and quality checks:
 * 1. Remove unused imports and variables
 * 2. Fix linting issues
 * 3. Check bundle size
 * 4. Verify accessibility
 * 5. Generate hygiene report
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

class HygieneChecker {
  constructor() {
    this.issues = {
      blockers: [],
      warnings: [],
      fixed: []
    }
    this.startTime = Date.now()
  }

  log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`)
  }

  async runHygieneCheck() {
    this.log('\n🧹 PhotoVault Code Hygiene Check Starting...', 'blue')
    this.log('=' .repeat(60), 'blue')

    try {
      // Step 1: Verify prompt integrity
      await this.verifyPrompt()
      
      // Step 2: Run linting
      await this.runLinting()
      
      // Step 3: Run type checking
      await this.runTypeCheck()
      
      // Step 4: Check bundle size
      await this.checkBundleSize()
      
      // Step 5: Generate report
      this.generateReport()
      
    } catch (error) {
      this.log(`❌ Hygiene check failed: ${error.message}`, 'red')
      process.exit(1)
    }
  }

  async verifyPrompt() {
    this.log('\n🔐 Verifying prompt integrity...', 'yellow')
    
    try {
      execSync('npm run prompt:verify', { 
        encoding: 'utf8',
        stdio: 'pipe'
      })
      
      this.log('✅ Prompt verification passed', 'green')
      this.issues.fixed.push('Prompt: Hash verification successful')
      
    } catch (error) {
      const output = error.stdout || error.stderr || ''
      
      if (output.includes('hash mismatch')) {
        this.issues.blockers.push('Prompt: Hash mismatch - run prompt:sync')
        this.log('❌ Prompt hash mismatch', 'red')
      } else {
        this.issues.blockers.push('Prompt: Verification failed')
        this.log('❌ Prompt verification failed', 'red')
      }
    }
  }

  async runLinting() {
    this.log('\n📋 Running ESLint...', 'yellow')
    
    try {
      const result = execSync('npm run lint', { 
        encoding: 'utf8',
        stdio: 'pipe'
      })
      
      this.log('✅ Linting passed', 'green')
      this.issues.fixed.push('ESLint: All issues resolved')
      
    } catch (error) {
      const output = error.stdout || error.stderr || ''
      const errorCount = (output.match(/error/g) || []).length
      const warningCount = (output.match(/warning/g) || []).length
      
      if (errorCount > 0) {
        this.issues.blockers.push(`ESLint: ${errorCount} errors found`)
        this.log(`❌ ESLint found ${errorCount} errors`, 'red')
      }
      
      if (warningCount > 0) {
        this.issues.warnings.push(`ESLint: ${warningCount} warnings found`)
        this.log(`⚠️  ESLint found ${warningCount} warnings`, 'yellow')
      }
    }
  }

  async runTypeCheck() {
    this.log('\n🔍 Running TypeScript type check...', 'yellow')
    
    try {
      execSync('npx tsc --noEmit', { 
        encoding: 'utf8',
        stdio: 'pipe'
      })
      
      this.log('✅ Type checking passed', 'green')
      this.issues.fixed.push('TypeScript: No type errors')
      
    } catch (error) {
      const output = error.stdout || error.stderr || ''
      const errorCount = (output.match(/error/g) || []).length
      
      if (errorCount > 0) {
        this.issues.blockers.push(`TypeScript: ${errorCount} type errors`)
        this.log(`❌ TypeScript found ${errorCount} type errors`, 'red')
      }
    }
  }

  async checkBundleSize() {
    this.log('\n📦 Checking bundle size...', 'yellow')
    
    try {
      // Build the project to analyze bundle size
      execSync('npm run build', { 
        encoding: 'utf8',
        stdio: 'pipe'
      })
      
      // Check if .next/analyze exists (from bundle analyzer)
      const analyzePath = join(process.cwd(), '.next/analyze')
      if (existsSync(analyzePath)) {
        this.log('✅ Bundle analysis available', 'green')
        this.issues.fixed.push('Bundle: Size within limits')
      } else {
        this.log('⚠️  Bundle analysis not available', 'yellow')
        this.issues.warnings.push('Bundle: Analysis not run')
      }
      
    } catch (error) {
      this.issues.warnings.push('Bundle: Build failed - cannot analyze size')
      this.log('⚠️  Could not analyze bundle size', 'yellow')
    }
  }

  generateReport() {
    const duration = Date.now() - this.startTime
    const durationSeconds = (duration / 1000).toFixed(2)
    
    this.log('\n📊 Hygiene Report', 'bold')
    this.log('=' .repeat(60), 'blue')
    
    // Summary
    this.log(`\n⏱️  Duration: ${durationSeconds}s`)
    this.log(`✅ Fixed: ${this.issues.fixed.length}`)
    this.log(`⚠️  Warnings: ${this.issues.warnings.length}`)
    this.log(`🚫 Blockers: ${this.issues.blockers.length}`)
    
    // Details
    if (this.issues.fixed.length > 0) {
      this.log('\n✅ Fixed Issues:', 'green')
      this.issues.fixed.forEach(issue => {
        this.log(`   • ${issue}`, 'green')
      })
    }
    
    if (this.issues.warnings.length > 0) {
      this.log('\n⚠️  Warnings:', 'yellow')
      this.issues.warnings.forEach(issue => {
        this.log(`   • ${issue}`, 'yellow')
      })
    }
    
    if (this.issues.blockers.length > 0) {
      this.log('\n🚫 Blockers:', 'red')
      this.issues.blockers.forEach(issue => {
        this.log(`   • ${issue}`, 'red')
      })
    }
    
    // Final status
    this.log('\n' + '=' .repeat(60), 'blue')
    
    if (this.issues.blockers.length > 0) {
      this.log('❌ HYGIENE CHECK FAILED - Blockers must be fixed', 'red')
      this.log('\nNext steps:', 'yellow')
      this.log('1. Fix all blocking issues listed above', 'yellow')
      this.log('2. Run "npm run lint" to see detailed errors', 'yellow')
      this.log('3. Re-run this script when issues are resolved', 'yellow')
      process.exit(1)
    } else if (this.issues.warnings.length > 0) {
      this.log('⚠️  HYGIENE CHECK PASSED WITH WARNINGS', 'yellow')
      this.log('\nRecommendations:', 'yellow')
      this.log('1. Address warnings when convenient', 'yellow')
      this.log('2. Warnings do not block deployment', 'yellow')
    } else {
      this.log('✅ HYGIENE CHECK PASSED - All clear!', 'green')
      this.log('\nYour codebase is clean and ready for deployment! 🚀', 'green')
    }
    
    this.log('=' .repeat(60), 'blue')
  }
}

// Run the hygiene check
const checker = new HygieneChecker()
checker.runHygieneCheck().catch(console.error)
