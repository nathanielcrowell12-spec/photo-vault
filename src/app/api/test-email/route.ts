import { resend, FROM_EMAIL } from '@/lib/email/resend';

export async function GET() {
  try {
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

