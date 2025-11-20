import { Resend } from 'resend';

export const FROM_EMAIL = process.env.FROM_EMAIL || 'PhotoVault <noreply@photovault.photo>';

// Lazy initialization to prevent build-time errors when RESEND_API_KEY is not set
let resendInstance: Resend | null = null;

export function getResendClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] RESEND_API_KEY is not defined. Email features will not work.');
    // Return a mock client during build to prevent errors
    return {
      emails: {
        send: async () => {
          throw new Error('RESEND_API_KEY is not configured');
        }
      }
    } as unknown as Resend;
  }

  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }

  return resendInstance;
}

// For backward compatibility - this getter is called lazily
export const resend = {
  get emails() {
    return getResendClient().emails;
  }
} as Resend;

