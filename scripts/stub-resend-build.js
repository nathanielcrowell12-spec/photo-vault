/**
 * Post-install script to stub resend module during Vercel builds
 * This prevents "Neither apiKey nor config.authenticator provided" errors
 * during the build phase when resend tries to instantiate without an API key
 */

const fs = require('fs');
const path = require('path');

// Only run during Vercel builds
const isVercelBuild = process.env.VERCEL === '1' && process.env.CI === '1';

if (isVercelBuild) {
  console.log('[Post-install] Detected Vercel build environment - stubbing resend module');

  const stubContent = `// Build-time stub for resend (auto-generated during Vercel build)
"use strict";

class Resend {
  constructor(apiKey) {
    // Stub constructor - accepts but ignores API key during build
    console.warn('[Resend Stub] Using build-time stub');
  }

  get emails() {
    return {
      send: async () => ({ id: 'stub', from: '', to: [], created_at: new Date().toISOString() })
    };
  }
}

// CommonJS exports to match resend package format
module.exports = { Resend };
module.exports.Resend = Resend;
module.exports.default = { Resend };
`;

  // Stub both dist and build directories
  const paths = [
    path.join(__dirname, '..', 'node_modules', 'resend', 'dist', 'index.js'),
    path.join(__dirname, '..', 'node_modules', 'resend', 'build', 'index.js'),
  ];

  let successCount = 0;
  let failCount = 0;

  for (const resendPath of paths) {
    try {
      // Backup original file
      const originalPath = resendPath + '.original';
      if (fs.existsSync(resendPath) && !fs.existsSync(originalPath)) {
        fs.copyFileSync(resendPath, originalPath);
        console.log(`[Post-install] Backed up original: ${resendPath}`);
      }

      // Write stub
      fs.writeFileSync(resendPath, stubContent, 'utf8');
      console.log(`[Post-install] Successfully stubbed: ${resendPath}`);
      successCount++;
    } catch (error) {
      console.error(`[Post-install] Failed to stub ${resendPath}:`, error.message);
      failCount++;
    }
  }

  console.log(`[Post-install] Summary: ${successCount} stubbed, ${failCount} failed`);
} else {
  console.log('[Post-install] Not a Vercel build - skipping resend stub');
}
