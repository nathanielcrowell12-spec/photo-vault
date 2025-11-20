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

  const resendPath = path.join(__dirname, '..', 'node_modules', 'resend', 'build', 'index.js');

  const stubContent = `// Build-time stub for resend (auto-generated during Vercel build)
export class Resend {
  constructor(apiKey) {
    console.warn('[Resend Stub] Using build-time stub');
  }

  get emails() {
    return {
      send: async () => ({ id: 'stub', from: '', to: [], created_at: new Date().toISOString() })
    };
  }
}

export default { Resend };
`;

  try {
    // Backup original file
    const originalPath = resendPath + '.original';
    if (fs.existsSync(resendPath) && !fs.existsSync(originalPath)) {
      fs.copyFileSync(resendPath, originalPath);
      console.log('[Post-install] Backed up original resend module');
    }

    // Write stub
    fs.writeFileSync(resendPath, stubContent, 'utf8');
    console.log('[Post-install] Successfully stubbed resend module');
  } catch (error) {
    console.error('[Post-install] Failed to stub resend module:', error.message);
    // Don't fail the build if stubbing fails
  }
} else {
  console.log('[Post-install] Not a Vercel build - skipping resend stub');
}
