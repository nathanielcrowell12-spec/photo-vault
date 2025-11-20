import { Resend } from 'resend';

export const FROM_EMAIL = process.env.FROM_EMAIL || 'PhotoVault <noreply@photovault.photo>';

// Lazy initialization to prevent build-time errors when RESEND_API_KEY is not set
let resendInstance: Resend | null = null;

export function getResendClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not defined. Email features will not work.');
  }

  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }

  return resendInstance;
}

// For backward compatibility - will throw at runtime if API key is missing
export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    return getResendClient()[prop as keyof Resend];
  }
});

