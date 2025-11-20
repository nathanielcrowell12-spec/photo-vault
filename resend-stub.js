// Stub module for resend during build
// This prevents build-time errors when resend tries to instantiate without API key

export class Resend {
  constructor(apiKey) {
    // Stub constructor - accepts but ignores API key during build
    console.warn('[Resend Stub] Using stub - real client will be loaded at runtime');
  }

  get emails() {
    return {
      send: async () => {
        console.log('[Resend Stub] Mock send called');
        return { id: 'stub', from: '', to: [], created_at: new Date().toISOString() };
      }
    };
  }
}

// Default export for CommonJS compatibility
export default { Resend };
