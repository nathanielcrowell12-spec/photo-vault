import { getResendClient, FROM_EMAIL } from '@/lib/email/resend';

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const resend = await getResendClient();
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'photovault.business@gmail.com',
      subject: 'PhotoVault Email Test',
      html: '<h1>✅ Email is working!</h1><p>Resend integration successful.</p>'
    });

    return Response.json({ success: true, data });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

