import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/email/unsubscribe?token=xxx
 *
 * One-click unsubscribe from drip emails. No login required.
 * Uses a signed UUID token tied to the drip_sequences record.
 *
 * CAN-SPAM compliant: works without authentication.
 * Only suppresses drip/marketing emails, NOT transactional (payment, password reset, etc.)
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return new NextResponse(renderUnsubscribePage('missing'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  try {
    const supabase = createServiceRoleClient()

    // Find the sequence by unsubscribe token
    const { data: sequence, error } = await supabase
      .from('drip_sequences')
      .select('id, user_id, sequence_name, suppressed')
      .eq('unsubscribe_token', token)
      .single()

    if (error || !sequence) {
      return new NextResponse(renderUnsubscribePage('invalid'), {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    if (sequence.suppressed) {
      return new NextResponse(renderUnsubscribePage('already'), {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // Suppress the sequence
    await supabase
      .from('drip_sequences')
      .update({ suppressed: true })
      .eq('id', sequence.id)

    // Skip all remaining pending emails
    await supabase
      .from('drip_emails')
      .update({ status: 'skipped', skipped_at: new Date().toISOString(), skip_reason: 'user_unsubscribed' })
      .eq('sequence_id', sequence.id)
      .in('status', ['pending', 'failed'])

    logger.info(`[Unsubscribe] User ${sequence.user_id} unsubscribed from ${sequence.sequence_name}`)

    return new NextResponse(renderUnsubscribePage('success'), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error: any) {
    logger.error('[Unsubscribe] Error processing unsubscribe:', error)
    return new NextResponse(renderUnsubscribePage('error'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

/**
 * POST /api/email/unsubscribe
 *
 * Supports List-Unsubscribe-Post one-click unsubscribe (RFC 8058).
 * Email clients send a POST with body: List-Unsubscribe=One-Click
 */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  try {
    const supabase = createServiceRoleClient()

    const { data: sequence, error } = await supabase
      .from('drip_sequences')
      .select('id, user_id, sequence_name')
      .eq('unsubscribe_token', token)
      .single()

    if (error || !sequence) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    // Suppress the sequence
    await supabase
      .from('drip_sequences')
      .update({ suppressed: true })
      .eq('id', sequence.id)

    // Skip all remaining pending emails
    await supabase
      .from('drip_emails')
      .update({ status: 'skipped', skipped_at: new Date().toISOString(), skip_reason: 'user_unsubscribed' })
      .eq('sequence_id', sequence.id)
      .in('status', ['pending', 'failed'])

    logger.info(`[Unsubscribe] One-click: User ${sequence.user_id} unsubscribed from ${sequence.sequence_name}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Unsubscribe] One-click error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ============================================================================
// MINIMAL UNSUBSCRIBE PAGE HTML
// ============================================================================

function renderUnsubscribePage(status: 'success' | 'already' | 'invalid' | 'missing' | 'error'): string {
  const messages: Record<string, { title: string; body: string }> = {
    success: {
      title: "You've been unsubscribed",
      body: "You won't receive any more emails in this sequence. Transactional emails (payment confirmations, password resets) are not affected.",
    },
    already: {
      title: 'Already unsubscribed',
      body: "You're already unsubscribed from this email sequence. No further action needed.",
    },
    invalid: {
      title: 'Invalid link',
      body: 'This unsubscribe link is not valid. It may have expired or already been used.',
    },
    missing: {
      title: 'Missing token',
      body: 'This unsubscribe link is incomplete. Please use the link from your email.',
    },
    error: {
      title: 'Something went wrong',
      body: 'We encountered an error processing your request. Please try again or contact support@photovault.photo.',
    },
  }

  const msg = messages[status]

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${msg.title} - PhotoVault</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 480px;
            margin: 80px auto;
            padding: 20px;
            text-align: center;
        }
        h1 { font-size: 24px; margin-bottom: 16px; }
        p { color: #6b7280; font-size: 16px; }
        a { color: #10b981; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>${msg.title}</h1>
    <p>${msg.body}</p>
    <p style="margin-top: 32px;"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://photovault.photo'}">Back to PhotoVault</a></p>
</body>
</html>`
}
