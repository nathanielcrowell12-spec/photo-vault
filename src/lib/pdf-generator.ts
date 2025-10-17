import jsPDF from 'jspdf'

export interface ReportData {
  photographer: {
    name: string
    email: string
    businessName?: string
  }
  period: {
    start: string
    end: string
    type: 'monthly' | 'quarterly' | 'yearly' | 'custom'
  }
  summary: {
    totalUpfrontCommission: number
    totalMonthlyCommission: number
    activeClientsCount: number
    monthlyRecurringClientsCount: number
    projectedMonthlyRecurring: number
    projectedYearlyTotal: number
  }
  transactions: Array<{
    date: string
    clientName: string
    amount: number
    type: 'upfront' | 'recurring'
    status: string
  }>
  topClients: Array<{
    name: string
    total: number
    upfront: number
    recurring: number
  }>
  analytics?: {
    monthlyBreakdown: Array<{
      month: string
      upfront: number
      recurring: number
      total: number
    }>
    growthMetrics: {
      revenueGrowth: number
      clientGrowth: number
      recurringGrowth: number
    }
  }
}

export class PDFReportGenerator {
  private doc: jsPDF

  constructor() {
    this.doc = new jsPDF()
  }

  generateRevenueReport(data: ReportData): jsPDF {
    // Set up document
    this.doc = new jsPDF()
    
    // Header
    this.addHeader(data)
    
    // Executive Summary
    this.addExecutiveSummary(data)
    
    // Revenue Breakdown
    this.addRevenueBreakdown(data)
    
    // Transaction Details
    this.addTransactionDetails(data)
    
    // Top Clients
    this.addTopClients(data)
    
    // Analytics (if available)
    if (data.analytics) {
      this.addAnalytics(data)
    }
    
    // Footer
    this.addFooter()
    
    return this.doc
  }

  private addHeader(data: ReportData) {
    // Title
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('PhotoVault Revenue Report', 20, 30)
    
    // Subtitle
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`For ${data.photographer.name}`, 20, 40)
    
    if (data.photographer.businessName) {
      this.doc.text(data.photographer.businessName, 20, 47)
    }
    
    // Period
    this.doc.text(`Period: ${this.formatDateRange(data.period.start, data.period.end)}`, 20, 57)
    
    // Generated date
    this.doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 67)
    
    // Logo placeholder (you can add actual logo later)
    this.doc.setFillColor(34, 197, 94) // Green color
    this.doc.rect(160, 20, 30, 30, 'F')
    this.doc.setFontSize(10)
    this.doc.setTextColor(255, 255, 255)
    this.doc.text('PhotoVault', 165, 35)
    this.doc.setTextColor(0, 0, 0)
  }

  private addExecutiveSummary(data: ReportData) {
    let yPosition = 85
    
    // Section title
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Executive Summary', 20, yPosition)
    yPosition += 15
    
    // Summary boxes
    const boxWidth = 55
    const boxHeight = 35
    const boxSpacing = 65
    
    // Total Revenue
    this.doc.setFillColor(240, 248, 255)
    this.doc.rect(20, yPosition, boxWidth, boxHeight, 'F')
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Total Revenue', 25, yPosition + 8)
    this.doc.setFontSize(14)
    this.doc.text(`$${this.formatCurrency(data.summary.totalUpfrontCommission + data.summary.totalMonthlyCommission)}`, 25, yPosition + 20)
    
    // Active Clients
    this.doc.setFillColor(240, 253, 244)
    this.doc.rect(20 + boxSpacing, yPosition, boxWidth, boxHeight, 'F')
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Active Clients', 25 + boxSpacing, yPosition + 8)
    this.doc.setFontSize(14)
    this.doc.text(`${data.summary.activeClientsCount}`, 25 + boxSpacing, yPosition + 20)
    
    // Monthly Recurring
    this.doc.setFillColor(255, 251, 235)
    this.doc.rect(20 + boxSpacing * 2, yPosition, boxWidth, boxHeight, 'F')
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Monthly Recurring', 25 + boxSpacing * 2, yPosition + 8)
    this.doc.setFontSize(14)
    this.doc.text(`$${this.formatCurrency(data.summary.projectedMonthlyRecurring)}`, 25 + boxSpacing * 2, yPosition + 20)
    
    yPosition += 50
  }

  private addRevenueBreakdown(data: ReportData) {
    let yPosition = 150
    
    // Section title
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Revenue Breakdown', 20, yPosition)
    yPosition += 15
    
    // Revenue breakdown table
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    
    // Table headers
    this.doc.text('Type', 20, yPosition)
    this.doc.text('Amount', 80, yPosition)
    this.doc.text('Percentage', 120, yPosition)
    this.doc.text('Clients', 160, yPosition)
    
    yPosition += 10
    
    const totalRevenue = data.summary.totalUpfrontCommission + data.summary.totalMonthlyCommission
    
    // Upfront revenue
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Upfront Commissions', 20, yPosition)
    this.doc.text(`$${this.formatCurrency(data.summary.totalUpfrontCommission)}`, 80, yPosition)
    this.doc.text(`${((data.summary.totalUpfrontCommission / totalRevenue) * 100).toFixed(1)}%`, 120, yPosition)
    this.doc.text(`${Math.round(data.summary.totalUpfrontCommission / 50)}`, 160, yPosition)
    
    yPosition += 10
    
    // Recurring revenue
    this.doc.text('Recurring Commissions', 20, yPosition)
    this.doc.text(`$${this.formatCurrency(data.summary.totalMonthlyCommission)}`, 80, yPosition)
    this.doc.text(`${((data.summary.totalMonthlyCommission / totalRevenue) * 100).toFixed(1)}%`, 120, yPosition)
    this.doc.text(`${data.summary.monthlyRecurringClientsCount}`, 160, yPosition)
    
    yPosition += 10
    
    // Total
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Total', 20, yPosition)
    this.doc.text(`$${this.formatCurrency(totalRevenue)}`, 80, yPosition)
    this.doc.text('100.0%', 120, yPosition)
    this.doc.text(`${data.summary.activeClientsCount}`, 160, yPosition)
  }

  private addTransactionDetails(data: ReportData) {
    let yPosition = 220
    
    // Check if we need a new page
    if (yPosition > 250) {
      this.doc.addPage()
      yPosition = 20
    }
    
    // Section title
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Recent Transactions', 20, yPosition)
    yPosition += 15
    
    // Transaction table headers
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Date', 20, yPosition)
    this.doc.text('Client', 60, yPosition)
    this.doc.text('Type', 120, yPosition)
    this.doc.text('Amount', 150, yPosition)
    this.doc.text('Status', 180, yPosition)
    
    yPosition += 10
    
    // Transaction rows
    this.doc.setFont('helvetica', 'normal')
    data.transactions.slice(0, 10).forEach(transaction => {
      if (yPosition > 270) {
        this.doc.addPage()
        yPosition = 20
      }
      
      this.doc.text(this.formatDate(transaction.date), 20, yPosition)
      this.doc.text(transaction.clientName, 60, yPosition)
      this.doc.text(transaction.type === 'upfront' ? 'Upfront' : 'Recurring', 120, yPosition)
      this.doc.text(`$${this.formatCurrency(transaction.amount)}`, 150, yPosition)
      this.doc.text(transaction.status, 180, yPosition)
      
      yPosition += 8
    })
  }

  private addTopClients(data: ReportData) {
    let yPosition = this.doc.internal.pageSize.height - 80
    
    // Check if we need a new page
    if (yPosition < 50) {
      this.doc.addPage()
      yPosition = 20
    }
    
    // Section title
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Top Earning Clients', 20, yPosition)
    yPosition += 15
    
    // Client table headers
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Rank', 20, yPosition)
    this.doc.text('Client Name', 40, yPosition)
    this.doc.text('Total Earned', 120, yPosition)
    this.doc.text('Upfront', 160, yPosition)
    this.doc.text('Recurring', 180, yPosition)
    
    yPosition += 10
    
    // Client rows
    this.doc.setFont('helvetica', 'normal')
    data.topClients.slice(0, 5).forEach((client, index) => {
      this.doc.text(`${index + 1}`, 20, yPosition)
      this.doc.text(client.name, 40, yPosition)
      this.doc.text(`$${this.formatCurrency(client.total)}`, 120, yPosition)
      this.doc.text(`$${this.formatCurrency(client.upfront)}`, 160, yPosition)
      this.doc.text(`$${this.formatCurrency(client.recurring)}`, 180, yPosition)
      
      yPosition += 8
    })
  }

  private addAnalytics(data: ReportData) {
    if (!data.analytics) return
    
    let yPosition = this.doc.internal.pageSize.height - 40
    
    // Check if we need a new page
    if (yPosition < 80) {
      this.doc.addPage()
      yPosition = 20
    }
    
    // Section title
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Growth Analytics', 20, yPosition)
    yPosition += 15
    
    // Growth metrics
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Growth Metrics:', 20, yPosition)
    yPosition += 12
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Revenue Growth: ${data.analytics.growthMetrics.revenueGrowth >= 0 ? '+' : ''}${data.analytics.growthMetrics.revenueGrowth.toFixed(1)}%`, 30, yPosition)
    yPosition += 8
    this.doc.text(`Client Growth: ${data.analytics.growthMetrics.clientGrowth >= 0 ? '+' : ''}${data.analytics.growthMetrics.clientGrowth.toFixed(1)}%`, 30, yPosition)
    yPosition += 8
    this.doc.text(`Recurring Growth: ${data.analytics.growthMetrics.recurringGrowth >= 0 ? '+' : ''}${data.analytics.growthMetrics.recurringGrowth.toFixed(1)}%`, 30, yPosition)
  }

  private addFooter() {
    const pageHeight = this.doc.internal.pageSize.height
    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(128, 128, 128)
    
    // Page number
    const pageCount = this.doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.doc.text(`Page ${i} of ${pageCount}`, 20, pageHeight - 10)
      this.doc.text('Generated by PhotoVault', 160, pageHeight - 10)
    }
    
    this.doc.setTextColor(0, 0, 0)
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  private formatDateRange(start: string, end: string): string {
    const startDate = new Date(start)
    const endDate = new Date(end)
    
    if (startDate.getFullYear() === endDate.getFullYear()) {
      return `${startDate.toLocaleDateString('en-US', { month: 'long' })} - ${endDate.toLocaleDateString('en-US', { month: 'long' })} ${startDate.getFullYear()}`
    } else {
      return `${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    }
  }
}

export function generateRevenueReportPDF(data: ReportData): Blob {
  const generator = new PDFReportGenerator()
  const pdf = generator.generateRevenueReport(data)
  return pdf.output('blob')
}
