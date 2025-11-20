/**
 * Resend Email Client - Lazy Loaded
 *
 * CRITICAL: This module uses dynamic imports to prevent Resend from being loaded
 * during Vercel's build phase. Do NOT add any static imports from 'resend' package.
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
 * This prevents build-time errors when RESEND_API_KEY is not available
 */
export async function getResendClient(): Promise<ResendClient> {
  // Skip initialization during build if API key is missing
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] RESEND_API_KEY not set - using mock client');

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

  // Return cached instance if already initialized
  if (resendInstance) {
    return resendInstance;
  }

  // Dynamic import and initialization
  try {
    const { Resend } = await import('resend');
    const client = new Resend(process.env.RESEND_API_KEY);
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

