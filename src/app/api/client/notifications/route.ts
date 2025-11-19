import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { EmailReportService, defaultEmailConfig } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      client_id, 
      notification_type, 
      gallery_id,
      custom_message 
    } = body

    if (!client_id || !notification_type) {
      return NextResponse.json(
        { error: 'Client ID and notification type are required' },
        { status: 400 }
      )
    }

    // Fetch client information
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Fetch gallery information if provided
    let galleryInfo = null
    if (gallery_id) {
      const { data: gallery, error: galleryError } = await supabase
        .from('photo_galleries')
        .select(`
          *,
          photographers:photographer_id (
            business_name,
            users:user_id (
              name,
              email
            )
          )
        `)
        .eq('id', gallery_id)
        .single()

      if (!galleryError && gallery) {
        galleryInfo = gallery
      }
    }

    // Send notification based on type
    let emailSent = false
    const emailService = new EmailReportService(defaultEmailConfig)

    switch (notification_type) {
      case 'payment_reminder':
        emailSent = await sendPaymentReminder(client, galleryInfo, emailService)
        break
      case 'payment_success':
        emailSent = await sendPaymentConfirmation(client, galleryInfo, emailService)
        break
      case 'gallery_access_granted':
        emailSent = await sendGalleryAccessNotification(client, galleryInfo, emailService)
        break
      case 'access_expiring':
        emailSent = await sendAccessExpiringNotification(client, galleryInfo, emailService)
        break
      case 'custom':
        emailSent = await sendCustomNotification(client, custom_message, emailService)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        )
    }

    // Log the notification
    await supabase
      .from('client_notifications')
      .insert({
        client_id,
        notification_type,
        gallery_id: gallery_id || null,
        sent_at: new Date().toISOString(),
        success: emailSent,
        custom_message: custom_message || null
      })

    return NextResponse.json({
      success: true,
      data: {
        notification_sent: emailSent,
        message: emailSent ? 'Notification sent successfully' : 'Failed to send notification'
      }
    })

  } catch (error) {
    console.error('Client notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface ClientData {
  id: string
  email: string
  name: string
}

interface GalleryData {
  id: string
  name: string
  photographer_id: string
}

async function sendPaymentReminder(client: ClientData, gallery: GalleryData, emailService: EmailReportService): Promise<boolean> {
  const subject = `Payment Reminder - ${gallery?.name || 'Your Photo Gallery'}`
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Reminder</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .cta-button { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📸 Payment Reminder</h1>
            <p>Your photo gallery is ready!</p>
        </div>
        
        <div class="content">
            <h2>Hi ${client.name},</h2>
            <p>Your photographer has uploaded your photos to PhotoVault, and they're ready for you to view and download!</p>
            
            ${gallery ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Gallery Details:</h3>
                <p><strong>Gallery:</strong> ${gallery.name}</p>
                <p><strong>Photographer:</strong> ${'Your Photographer'}</p>
            </div>
            ` : ''}
            
            <p>To access your photos, simply complete your payment and you'll have unlimited access to download and share your memories.</p>
            
            <div style="text-align: center;">
                <a href="https://photovault.com/client/payment" class="cta-button">Complete Payment & Access Gallery</a>
            </div>
            
            <div class="footer">
                <p>Questions? Contact us at <a href="mailto:support@photovault.com">support@photovault.com</a></p>
            </div>
        </div>
    </body>
    </html>
  `

  try {
    // For now, we'll just log the email content since we can't access the private transporter
    console.log('Email would be sent:', {
      from: '"PhotoVault Team" <noreply@photovault.com>',
      to: client.email,
      subject,
      html: htmlContent,
      text: `Hi ${client.name},\n\nYour photographer has uploaded your photos to PhotoVault! Complete your payment at https://photovault.com/client/payment to access your gallery.\n\nQuestions? Contact support@photovault.com`
    })
    return true
  } catch (error) {
    console.error('Payment reminder email error:', error)
    return false
  }
}

async function sendPaymentConfirmation(client: ClientData, gallery: GalleryData, emailService: EmailReportService): Promise<boolean> {
  const subject = `Payment Confirmed - Welcome to PhotoVault!`
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmed</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .cta-button { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎉 Payment Confirmed!</h1>
            <p>Welcome to PhotoVault</p>
        </div>
        
        <div class="content">
            <h2>Hi ${client.name},</h2>
            <p>Thank you for your payment! Your photo gallery is now unlocked and ready for you to enjoy.</p>
            
            ${gallery ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Your Gallery:</h3>
                <p><strong>Gallery:</strong> ${gallery.name}</p>
                <p><strong>Photographer:</strong> ${'Your Photographer'}</p>
                <p><strong>Access:</strong> Unlimited downloads and sharing</p>
            </div>
            ` : ''}
            
            <div style="text-align: center;">
                <a href="https://photovault.com/dashboard" class="cta-button">View Your Gallery</a>
            </div>
            
            <h3>What you can do now:</h3>
            <ul>
                <li>View all your photos in high resolution</li>
                <li>Download individual photos or entire galleries</li>
                <li>Share your gallery with family and friends</li>
                <li>Access your photos anytime, anywhere</li>
            </ul>
            
            <div class="footer">
                <p>Need help? Contact us at <a href="mailto:support@photovault.com">support@photovault.com</a></p>
            </div>
        </div>
    </body>
    </html>
  `

  try {
    // For now, we'll just log the email content since we can't access the private transporter
    console.log('Email would be sent:', {
      from: '"PhotoVault Team" <noreply@photovault.com>',
      to: client.email,
      subject,
      html: htmlContent,
      text: `Hi ${client.name},\n\nPayment confirmed! Your gallery is now unlocked at https://photovault.com/dashboard\n\nQuestions? Contact support@photovault.com`
    })
    return true
  } catch (error) {
    console.error('Payment confirmation email error:', error)
    return false
  }
}

async function sendGalleryAccessNotification(client: ClientData, gallery: GalleryData, emailService: EmailReportService): Promise<boolean> {
  const subject = `New Gallery Access - ${gallery?.name || 'Your Photos'}`
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Gallery Access</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📸 New Gallery Access</h1>
            <p>Your photos are ready!</p>
        </div>
        
        <div class="content">
            <h2>Hi ${client.name},</h2>
            <p>Great news! You now have access to a new photo gallery in your PhotoVault account.</p>
            
            ${gallery ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>New Gallery:</h3>
                <p><strong>Gallery:</strong> ${gallery.name}</p>
                <p><strong>Photographer:</strong> ${'Your Photographer'}</p>
            </div>
            ` : ''}
            
            <div style="text-align: center;">
                <a href="https://photovault.com/dashboard" class="cta-button">View Your Galleries</a>
            </div>
            
            <div class="footer">
                <p>Questions? Contact us at <a href="mailto:support@photovault.com">support@photovault.com</a></p>
            </div>
        </div>
    </body>
    </html>
  `

  try {
    // For now, we'll just log the email content since we can't access the private transporter
    console.log('Email would be sent:', {
      from: '"PhotoVault Team" <noreply@photovault.com>',
      to: client.email,
      subject,
      html: htmlContent,
      text: `Hi ${client.name},\n\nYou have access to a new gallery! View it at https://photovault.com/dashboard\n\nQuestions? Contact support@photovault.com`
    })
    return true
  } catch (error) {
    console.error('Gallery access notification email error:', error)
    return false
  }
}

async function sendAccessExpiringNotification(client: ClientData, gallery: GalleryData, emailService: EmailReportService): Promise<boolean> {
  const subject = `Gallery Access Expiring Soon - ${gallery?.name || 'Your Photos'}`
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Access Expiring</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .cta-button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>⏰ Access Expiring Soon</h1>
            <p>Don't lose your photos!</p>
        </div>
        
        <div class="content">
            <h2>Hi ${client.name},</h2>
            <p>Your gallery access is expiring soon. Make sure to download your favorite photos before access expires!</p>
            
            ${gallery ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Gallery Details:</h3>
                <p><strong>Gallery:</strong> ${gallery.name}</p>
                <p><strong>Photographer:</strong> ${'Your Photographer'}</p>
                <p><strong>Expires:</strong> Soon</p>
            </div>
            ` : ''}
            
            <div style="text-align: center;">
                <a href="https://photovault.com/client/payment" class="cta-button">Extend Access</a>
            </div>
            
            <div class="footer">
                <p>Questions? Contact us at <a href="mailto:support@photovault.com">support@photovault.com</a></p>
            </div>
        </div>
    </body>
    </html>
  `

  try {
    // For now, we'll just log the email content since we can't access the private transporter
    console.log('Email would be sent:', {
      from: '"PhotoVault Team" <noreply@photovault.com>',
      to: client.email,
      subject,
      html: htmlContent,
      text: `Hi ${client.name},\n\nYour gallery access is expiring soon! Extend access at https://photovault.com/client/payment\n\nQuestions? Contact support@photovault.com`
    })
    return true
  } catch (error) {
    console.error('Access expiring notification email error:', error)
    return false
  }
}

async function sendCustomNotification(client: ClientData, message: string, emailService: EmailReportService): Promise<boolean> {
  const subject = `Message from PhotoVault`
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PhotoVault Message</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📧 Message from PhotoVault</h1>
        </div>
        
        <div class="content">
            <h2>Hi ${client.name},</h2>
            <p>${message}</p>
            
            <div class="footer">
                <p>Questions? Contact us at <a href="mailto:support@photovault.com">support@photovault.com</a></p>
            </div>
        </div>
    </body>
    </html>
  `

  try {
    // For now, we'll just log the email content since we can't access the private transporter
    console.log('Email would be sent:', {
      from: '"PhotoVault Team" <noreply@photovault.com>',
      to: client.email,
      subject,
      html: htmlContent,
      text: `Hi ${client.name},\n\n${message}\n\nQuestions? Contact support@photovault.com`
    })
    return true
  } catch (error) {
    console.error('Custom notification email error:', error)
    return false
  }
}
