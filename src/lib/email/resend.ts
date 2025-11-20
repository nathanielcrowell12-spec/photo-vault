/**
 * Resend Email Client - Lazy Loaded
 *
 * CRITICAL: This module MUST NOT be imported during build phase.
 * All consumers should use dynamic imports: const { getResendClient } = await import('@/lib/email/resend')
 */

export const FROM_EMAIL = process.env.FROM_EMAIL || 'PhotoVault <noreply@photovault.photo>';

// Type definition for Resend client (without importing the actual package)
interface ResendClient {
  emails: {
    send: (params: {
      from: string;
      to: string | string[];
      subject: string;
      html?: string;
      text?: string;
    }) => Promise<{ id: string; from: string; to: string[]; created_at: string }>;
  };
}

// Cache for initialized client
let resendInstance: ResendClient | null = null;
let mockInstance: ResendClient | null = null;

/**
 * Get Resend client - dynamically imports and initializes on first use
 * Returns mock client during build phase or when API key is missing
 */
export async function getResendClient(): Promise<ResendClient> {
  // Return cached instance if already initialized
  if (resendInstance) {
    return resendInstance;
  }

  // CRITICAL: Detect if we're in Vercel build phase
  // During build, skip real initialization and return mock
  const isVercelBuild = process.env.VERCEL === '1' && process.env.CI === '1';

  // Return mock if API key is not available OR if we're in build phase
  if (!process.env.RESEND_API_KEY || isVercelBuild) {
    const reason = isVercelBuild ? 'Vercel build phase' : 'RESEND_API_KEY not set';
    console.warn(`[Resend] Using mock client - ${reason}`);

    if (!mockInstance) {
      mockInstance = {
        emails: {
          send: async (params) => {
            console.log('[Resend Mock] Would send email:', {
              to: params.to,
              subject: params.subject
            });
            return {
              id: 'mock-' + Date.now(),
              from: params.from,
              to: Array.isArray(params.to) ? params.to : [params.to],
              created_at: new Date().toISOString()
            };
          }
        }
      };
    }
    return mockInstance;
  }

  // Dynamic import and initialization (only at runtime with API key)
  try {
    // Try to dynamically import resend - this may fail during build
    let ResendClass;
    try {
      const resendModule = await import('resend');
      ResendClass = resendModule.Resend;
    } catch (importError) {
      console.warn('[Resend] Failed to import resend module:', importError);
      // Return mock if import fails (e.g., during build)
      if (!mockInstance) {
        mockInstance = {
          emails: {
            send: async (params) => {
              console.log('[Resend Mock] Would send email (import failed):', {
                to: params.to,
                subject: params.subject
              });
              return {
                id: 'mock-' + Date.now(),
                from: params.from,
                to: Array.isArray(params.to) ? params.to : [params.to],
                created_at: new Date().toISOString()
              };
            }
          }
        };
      }
      return mockInstance;
    }

    const client = new ResendClass(process.env.RESEND_API_KEY);
    resendInstance = client as unknown as ResendClient;
    console.log('[Resend] Client initialized successfully');
    return resendInstance;
  } catch (error) {
    console.error('[Resend] Failed to initialize client:', error);

    // Fall back to mock on error
    if (!mockInstance) {
      mockInstance = {
        emails: {
          send: async (params) => {
            console.error('[Resend Error] Cannot send email - initialization failed');
            throw new Error('Resend client initialization failed');
          }
        }
      };
    }
    return mockInstance;
  }
}

// IMPORTANT: Do not export a const resend object - it will be evaluated at module load time
// Instead, consumers should use getResendClient() directly

