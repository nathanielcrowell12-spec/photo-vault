import { getResendClient, FROM_EMAIL } from './resend';

export async function sendPhotographerSuspensionWarning(
  photographerEmail: string,
  daysRemaining: number
) {
  try {
    await (await getResendClient()).emails.send({
      from: FROM_EMAIL,
      to: photographerEmail,
      subject: `⚠️ Payment Overdue - ${daysRemaining} Days Until Account Deletion`,
      html: `
        <h2>Payment Required</h2>
        <p>Your PhotoVault platform subscription payment is overdue.</p>
        <p><strong>${daysRemaining} days remaining</strong> until your account is deleted and all clients are transferred.</p>
        <p>Update your payment method to avoid losing access.</p>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error };
  }
}

export async function sendPhotographerDeleted(
  photographerEmail: string,
  clientCount: number
) {
  try {
    await (await getResendClient()).emails.send({
      from: FROM_EMAIL,
      to: photographerEmail,
      subject: 'PhotoVault Account Deleted',
      html: `
        <h2>Account Deleted</h2>
        <p>Your PhotoVault account has been permanently deleted due to non-payment.</p>
        <p><strong>${clientCount} clients</strong> have been transferred to PhotoVault management.</p>
        <p>All future commission payments have been forfeited.</p>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error };
  }
}

export async function sendCommissionPaid(
  photographerEmail: string,
  amount: number,
  clientName: string
) {
  try {
    await (await getResendClient()).emails.send({
      from: FROM_EMAIL,
      to: photographerEmail,
      subject: `💰 Commission Payment Processed - $${(amount / 100).toFixed(2)}`,
      html: `
        <h2>Commission Paid</h2>
        <p>Your commission payment has been processed.</p>
        <ul>
          <li><strong>Amount:</strong> $${(amount / 100).toFixed(2)}</li>
          <li><strong>Client:</strong> ${clientName}</li>
          <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
        </ul>
        <p>Funds will arrive in your account within 2-3 business days.</p>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error };
  }
}

export async function sendClientPaymentFailed(
  clientEmail: string,
  photographerEmail: string,
  daysRemaining: number
) {
  try {
    await (await getResendClient()).emails.send({
      from: FROM_EMAIL,
      to: clientEmail,
      subject: 'Payment Failed - Update Payment Method',
      html: `
        <h2>Payment Update Required</h2>
        <p>We couldn't process your monthly storage payment.</p>
        <p><strong>${daysRemaining} days remaining</strong> before your photos are archived.</p>
        <p>Update your payment method to maintain access.</p>
      `
    });

    await (await getResendClient()).emails.send({
      from: FROM_EMAIL,
      to: photographerEmail,
      subject: 'Client Payment Failed',
      html: `
        <h2>Client Payment Issue</h2>
        <p>Your client ${clientEmail} had a payment failure.</p>
        <p>They have ${daysRemaining} days to update their payment method.</p>
        <p>You may want to reach out to them directly.</p>
      `
    });

    return { success: true };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error };
  }
}

export async function sendClientDeactivated(
  photographerEmail: string,
  clientEmail: string
) {
  try {
    await (await getResendClient()).emails.send({
      from: FROM_EMAIL,
      to: photographerEmail,
      subject: 'Client Account Deactivated',
      html: `
        <h2>Client Deactivated</h2>
        <p>Your client ${clientEmail} has been deactivated after 90 days of non-payment.</p>
        <p>Their photos have been archived and your recurring commission has ended.</p>
        <p>If they reactivate, you will resume earning commissions.</p>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error };
  }
}

