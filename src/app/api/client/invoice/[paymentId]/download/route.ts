import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Fetch payment details with related data
    const { data: payment, error: paymentError } = await supabase
      .from('client_payments')
      .select(`
        *,
        clients:client_id (
          name,
          email,
          phone,
          billing_address
        ),
        galleries:gallery_id (
          name,
          photographers:photographer_id (
            business_name,
            users:user_id (
              name,
              email,
              phone
            )
          )
        ),
        payment_options:payment_option_id (
          name,
          price,
          duration
        )
      `)
      .eq('id', paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Generate PDF invoice
    const pdf = generateInvoicePDF(payment)

    // Return PDF as blob
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="photovault-invoice-${paymentId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Invoice download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface PaymentData {
  id: string
  amount: number
  status: string
  created_at: string
  gallery_id: string
  user_id: string
  client_id: string
  clients?: {
    name: string
    email: string
    phone?: string
    billing_address?: string
  }
  galleries?: {
    name: string
    photographers?: {
      business_name: string
      users?: {
        name: string
        email: string
        phone?: string
      }
    }
  }
  payment_options?: {
    name: string
    price: number
    duration: number
  }
}

function generateInvoicePDF(payment: PaymentData): jsPDF {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('PhotoVault', 20, 30)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Professional Photo Sharing Platform', 20, 38)
  
  // Invoice details
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', 160, 30)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice #: ${payment.id}`, 160, 38)
  doc.text(`Date: ${new Date(payment.created_at).toLocaleDateString()}`, 160, 44)
  doc.text(`Status: ${payment.status.toUpperCase()}`, 160, 50)
  
  // Billing address
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Bill To:', 20, 65)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(payment.clients?.name || 'Client Name', 20, 72)
  doc.text(payment.clients?.email || 'client@email.com', 20, 78)
  if (payment.clients?.billing_address) {
    const addressLines = payment.clients.billing_address.split('\n')
    addressLines.forEach((line: string, index: number) => {
      doc.text(line, 20, 84 + (index * 6))
    })
  }
  
  // Service details
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Service Details:', 20, 110)
  
  // Table headers
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Description', 20, 120)
  doc.text('Photographer', 80, 120)
  doc.text('Amount', 160, 120)
  
  // Table content
  doc.setFont('helvetica', 'normal')
  const serviceDescription = `${payment.galleries?.name || 'Photo Gallery Access'} - ${payment.payment_options?.name || 'Access Plan'}`
  const photographerName = payment.galleries?.photographers?.business_name || 'Photographer'
  
  doc.text(serviceDescription, 20, 128)
  doc.text(photographerName, 80, 128)
  doc.text(`$${payment.amount}`, 160, 128)
  
  // Payment information
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Payment Information:', 20, 150)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Payment Method: Card ending in 4242`, 20, 158)
  doc.text(`Payment Date: ${new Date(payment.created_at).toLocaleDateString()}`, 20, 164)
  doc.text(`Gallery Access Until: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}`, 20, 170)
  
  // Total
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Total Paid:', 140, 190)
  doc.text(`$${payment.amount}`, 160, 190)
  
  // Footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(128, 128, 128)
  doc.text('Thank you for using PhotoVault!', 20, 250)
  doc.text('For support, contact us at support@photovault.com', 20, 256)
  doc.text('This invoice was generated automatically.', 20, 262)
  
  doc.setTextColor(0, 0, 0)
  
  return doc
}
