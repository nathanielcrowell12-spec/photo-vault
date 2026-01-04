import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getResendClient, FROM_EMAIL } from '@/lib/email/resend'

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@photovault.photo'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subject, category, message, priority } = body

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      )
    }

    // Get user profile for more context
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, user_type')
      .eq('id', user.id)
      .single()

    const userName = profile?.full_name || 'Unknown User'
    const userType = profile?.user_type || 'unknown'

    // Build email HTML
    const priorityColors: Record<string, string> = {
      low: '#22c55e',
      normal: '#3b82f6',
      high: '#ef4444'
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">New Support Ticket</h1>
        </div>

        <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 120px;">From:</td>
              <td style="padding: 8px 0; font-weight: bold;">${userName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${user.email}">${user.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">User Type:</td>
              <td style="padding: 8px 0; text-transform: capitalize;">${userType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Category:</td>
              <td style="padding: 8px 0; text-transform: capitalize;">${category || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Priority:</td>
              <td style="padding: 8px 0;">
                <span style="background: ${priorityColors[priority] || priorityColors.normal}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">
                  ${priority || 'normal'}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
          <h2 style="margin-top: 0; color: #1e293b;">${subject}</h2>
          <div style="color: #475569; white-space: pre-wrap; line-height: 1.6;">
${message}
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="margin: 0; color: #64748b; font-size: 12px;">
            Reply directly to this email to respond to the customer.
          </p>
        </div>
      </div>
    `

    // Send email via Resend
    const resend = await getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: SUPPORT_EMAIL,
      subject: `[${priority?.toUpperCase() || 'NORMAL'}] ${subject} - ${userName}`,
      html: emailHtml,
    })

    // Send confirmation to user
    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email!,
      subject: `Support Request Received: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">We've Got Your Message!</h1>
          </div>

          <div style="background: white; padding: 20px; border: 1px solid #e2e8f0;">
            <p>Hi ${userName},</p>
            <p>Thanks for reaching out! We've received your support request and will get back to you within 24 hours.</p>

            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 0;"><strong>Category:</strong> ${category || 'General'}</p>
            </div>

            <p>If you need immediate assistance, you can also reach us at:</p>
            <ul>
              <li>Email: <a href="mailto:support@photovault.photo">support@photovault.photo</a></li>
              <li>Phone: (608) 571-7532</li>
            </ul>

            <p>Best regards,<br>The PhotoVault Team</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: 'Support ticket submitted successfully' })

  } catch (error) {
    console.error('Support ticket error:', error)
    return NextResponse.json(
      { error: 'Failed to submit support ticket' },
      { status: 500 }
    )
  }
}
