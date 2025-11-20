// Use type-only import to avoid loading Resend at module evaluation time
import type { Resend } from 'resend';

export const FROM_EMAIL = process.env.FROM_EMAIL || 'PhotoVault <noreply@photovault.photo>';

// Lazy initialization to prevent build-time errors when RESEND_API_KEY is not set
let resendInstance: Resend | null = null;
let mockInstance: Resend | null = null;

export async function getResendClient(): Promise<Resend> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] RESEND_API_KEY is not defined. Email features will not work.');

    // Return cached mock client to avoid recreating it
    if (!mockInstance) {
      mockInstance = {
        emails: {
          send: async () => {
            throw new Error('RESEND_API_KEY is not configured');
          }
        }
      } as unknown as Resend;
    }
    return mockInstance;
  }

  if (!resendInstance) {
    try {
      // Dynamic import to prevent loading Resend until actually needed
      const { Resend: ResendClass } = await import('resend');
      resendInstance = new ResendClass(process.env.RESEND_API_KEY);
    } catch (error) {
      console.error('[Resend] Failed to initialize:', error);
      // If initialization fails, return mock client
      if (!mockInstance) {
        mockInstance = {
          emails: {
            send: async () => {
              throw new Error('Resend client failed to initialize');
            }
          }
        } as unknown as Resend;
      }
      return mockInstance;
    }
  }

  return resendInstance;
}

// IMPORTANT: Do not export a const resend object - it will be evaluated at module load time
// Instead, consumers should use getResendClient() directly

