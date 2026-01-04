import nodemailer from 'nodemailer'
import { logger } from './logger'

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

export interface EmailReportData {
  to: string
  photographerName: string
  businessName?: string
  reportType: 'monthly' | 'quarterly' | 'yearly' | 'custom'
  period: {
    start: string
    end: string
  }
  summary: {
    totalRevenue: number
    totalClients: number
    monthlyRecurring: number
    growth: number
  }
  attachment?: {
    filename: string
    content: Buffer
    contentType: string
  }
}

export class EmailReportService {
  private transporter: nodemailer.Transporter

  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransport(config)
  }

  async sendMonthlyReport(data: EmailReportData): Promise<boolean> {
    const subject = `PhotoVault Monthly Revenue Report - ${this.formatPeriod(data.period.start, data.period.end)}`
    const htmlContent = this.generateMonthlyReportHTML(data)
    const textContent = this.generateMonthlyReportText(data)

    try {
      await this.transporter.sendMail({
        from: '"PhotoVault Team" <noreply@photovault.photo>',
        to: data.to,
        subject,
        text: textContent,
        html: htmlContent,
        attachments: data.attachment ? [data.attachment] : undefined
      })

      return true
    } catch (error) {
      logger.error('[EmailReport] Error sending monthly report:', error)
      return false
    }
  }

  async sendQuarterlyReport(data: EmailReportData): Promise<boolean> {
    const subject = `PhotoVault Quarterly Revenue Report - ${this.formatPeriod(data.period.start, data.period.end)}`
    const htmlContent = this.generateQuarterlyReportHTML(data)
    const textContent = this.generateQuarterlyReportText(data)

    try {
      await this.transporter.sendMail({
        from: '"PhotoVault Team" <noreply@photovault.photo>',
        to: data.to,
        subject,
        text: textContent,
        html: htmlContent,
        attachments: data.attachment ? [data.attachment] : undefined
      })

      return true
    } catch (error) {
      logger.error('[EmailReport] Error sending quarterly report:', error)
      return false
    }
  }

  async sendYearlyReport(data: EmailReportData): Promise<boolean> {
    const subject = `PhotoVault Annual Revenue Report - ${this.formatYear(data.period.start)}`
    const htmlContent = this.generateYearlyReportHTML(data)
    const textContent = this.generateYearlyReportText(data)

    try {
      await this.transporter.sendMail({
        from: '"PhotoVault Team" <noreply@photovault.photo>',
        to: data.to,
        subject,
        text: textContent,
        html: htmlContent,
        attachments: data.attachment ? [data.attachment] : undefined
      })

      return true
    } catch (error) {
      logger.error('[EmailReport] Error sending yearly report:', error)
      return false
    }
  }

  private generateMonthlyReportHTML(data: EmailReportData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PhotoVault Monthly Report</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
            .summary-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .summary-value { font-size: 24px; font-weight: bold; color: #22c55e; margin: 10px 0; }
            .summary-label { color: #6b7280; font-size: 14px; }
            .growth-positive { color: #22c55e; }
            .growth-negative { color: #ef4444; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
            .cta-button { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📊 Monthly Revenue Report</h1>
            <p>${data.businessName || data.photographerName}</p>
            <p>${this.formatPeriod(data.period.start, data.period.end)}</p>
        </div>
        
        <div class="content">
            <h2>Revenue Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-value">$${this.formatCurrency(data.summary.totalRevenue)}</div>
                    <div class="summary-label">Total Revenue</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${data.summary.totalClients}</div>
                    <div class="summary-label">Active Clients</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">$${this.formatCurrency(data.summary.monthlyRecurring)}</div>
                    <div class="summary-label">Monthly Recurring</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value ${data.summary.growth >= 0 ? 'growth-positive' : 'growth-negative'}">
                        ${data.summary.growth >= 0 ? '+' : ''}${data.summary.growth.toFixed(1)}%
                    </div>
                    <div class="summary-label">Growth Rate</div>
                </div>
            </div>

            <h3>Key Highlights</h3>
            <ul>
                <li><strong>$${this.formatCurrency(data.summary.totalRevenue)}</strong> total commission earned this month</li>
                <li><strong>${data.summary.totalClients}</strong> active clients generating revenue</li>
                <li><strong>$${this.formatCurrency(data.summary.monthlyRecurring)}</strong> in monthly recurring passive income</li>
                <li><strong>${data.summary.growth >= 0 ? '+' : ''}${data.summary.growth.toFixed(1)}%</strong> growth compared to last month</li>
            </ul>

            <div style="text-align: center;">
                <a href="https://photovault.photo/photographers/revenue" class="cta-button">View Detailed Dashboard</a>
            </div>

            <div class="footer">
                <p>This report was automatically generated by PhotoVault.</p>
                <p>Questions? Contact us at <a href="mailto:support@photovault.photo">support@photovault.photo</a></p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  private generateQuarterlyReportHTML(data: EmailReportData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PhotoVault Quarterly Report</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
            .summary-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .summary-value { font-size: 24px; font-weight: bold; color: #3b82f6; margin: 10px 0; }
            .summary-label { color: #6b7280; font-size: 14px; }
            .growth-positive { color: #22c55e; }
            .growth-negative { color: #ef4444; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
            .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📈 Quarterly Revenue Report</h1>
            <p>${data.businessName || data.photographerName}</p>
            <p>${this.formatPeriod(data.period.start, data.period.end)}</p>
        </div>
        
        <div class="content">
            <h2>Quarterly Performance</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-value">$${this.formatCurrency(data.summary.totalRevenue)}</div>
                    <div class="summary-label">Quarterly Revenue</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${data.summary.totalClients}</div>
                    <div class="summary-label">Total Clients</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">$${this.formatCurrency(data.summary.monthlyRecurring)}</div>
                    <div class="summary-label">Monthly Recurring</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value ${data.summary.growth >= 0 ? 'growth-positive' : 'growth-negative'}">
                        ${data.summary.growth >= 0 ? '+' : ''}${data.summary.growth.toFixed(1)}%
                    </div>
                    <div class="summary-label">Quarterly Growth</div>
                </div>
            </div>

            <h3>Quarter Highlights</h3>
            <ul>
                <li><strong>$${this.formatCurrency(data.summary.totalRevenue)}</strong> total commission earned this quarter</li>
                <li><strong>${data.summary.totalClients}</strong> clients generating revenue</li>
                <li><strong>$${this.formatCurrency(data.summary.monthlyRecurring)}</strong> monthly recurring passive income</li>
                <li><strong>${data.summary.growth >= 0 ? '+' : ''}${data.summary.growth.toFixed(1)}%</strong> growth compared to last quarter</li>
            </ul>

            <div style="text-align: center;">
                <a href="https://photovault.photo/photographers/analytics" class="cta-button">View Analytics Dashboard</a>
            </div>

            <div class="footer">
                <p>This quarterly report was automatically generated by PhotoVault.</p>
                <p>Questions? Contact us at <a href="mailto:support@photovault.photo">support@photovault.photo</a></p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  private generateYearlyReportHTML(data: EmailReportData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PhotoVault Annual Report</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
            .summary-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .summary-value { font-size: 24px; font-weight: bold; color: #8b5cf6; margin: 10px 0; }
            .summary-label { color: #6b7280; font-size: 14px; }
            .growth-positive { color: #22c55e; }
            .growth-negative { color: #ef4444; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
            .cta-button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎉 Annual Revenue Report</h1>
            <p>${data.businessName || data.photographerName}</p>
            <p>${this.formatYear(data.period.start)}</p>
        </div>
        
        <div class="content">
            <h2>Year in Review</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-value">$${this.formatCurrency(data.summary.totalRevenue)}</div>
                    <div class="summary-label">Annual Revenue</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${data.summary.totalClients}</div>
                    <div class="summary-label">Total Clients</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">$${this.formatCurrency(data.summary.monthlyRecurring)}</div>
                    <div class="summary-label">Monthly Recurring</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value ${data.summary.growth >= 0 ? 'growth-positive' : 'growth-negative'}">
                        ${data.summary.growth >= 0 ? '+' : ''}${data.summary.growth.toFixed(1)}%
                    </div>
                    <div class="summary-label">Annual Growth</div>
                </div>
            </div>

            <h3>Year Highlights</h3>
            <ul>
                <li><strong>$${this.formatCurrency(data.summary.totalRevenue)}</strong> total commission earned this year</li>
                <li><strong>${data.summary.totalClients}</strong> clients generating revenue</li>
                <li><strong>$${this.formatCurrency(data.summary.monthlyRecurring)}</strong> monthly recurring passive income</li>
                <li><strong>${data.summary.growth >= 0 ? '+' : ''}${data.summary.growth.toFixed(1)}%</strong> growth compared to last year</li>
            </ul>

            <div style="text-align: center;">
                <a href="https://photovault.photo/photographers/analytics" class="cta-button">View Full Analytics</a>
            </div>

            <div class="footer">
                <p>Thank you for using PhotoVault this year! This annual report was automatically generated.</p>
                <p>Questions? Contact us at <a href="mailto:support@photovault.photo">support@photovault.photo</a></p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  private generateMonthlyReportText(data: EmailReportData): string {
    return `
PhotoVault Monthly Revenue Report
${data.businessName || data.photographerName}
Period: ${this.formatPeriod(data.period.start, data.period.end)}

REVENUE SUMMARY:
- Total Revenue: $${this.formatCurrency(data.summary.totalRevenue)}
- Active Clients: ${data.summary.totalClients}
- Monthly Recurring: $${this.formatCurrency(data.summary.monthlyRecurring)}
- Growth Rate: ${data.summary.growth >= 0 ? '+' : ''}${data.summary.growth.toFixed(1)}%

KEY HIGHLIGHTS:
• $${this.formatCurrency(data.summary.totalRevenue)} total commission earned this month
• ${data.summary.totalClients} active clients generating revenue
• $${this.formatCurrency(data.summary.monthlyRecurring)} in monthly recurring passive income
• ${data.summary.growth >= 0 ? '+' : ''}${data.summary.growth.toFixed(1)}% growth compared to last month

View your detailed dashboard: https://photovault.photo/photographers/revenue

Questions? Contact us at support@photovault.photo

---
This report was automatically generated by PhotoVault.
    `.trim()
  }

  private generateQuarterlyReportText(data: EmailReportData): string {
    return `
PhotoVault Quarterly Revenue Report
${data.businessName || data.photographerName}
Period: ${this.formatPeriod(data.period.start, data.period.end)}

QUARTERLY PERFORMANCE:
- Quarterly Revenue: $${this.formatCurrency(data.summary.totalRevenue)}
- Total Clients: ${data.summary.totalClients}
- Monthly Recurring: $${this.formatCurrency(data.summary.monthlyRecurring)}
- Quarterly Growth: ${data.summary.growth >= 0 ? '+' : ''}${data.summary.growth.toFixed(1)}%

QUARTER HIGHLIGHTS:
• $${this.formatCurrency(data.summary.totalRevenue)} total commission earned this quarter
• ${data.summary.totalClients} clients generating revenue
• $${this.formatCurrency(data.summary.monthlyRecurring)} monthly recurring passive income
• ${data.summary.growth >= 0 ? '+' : ''}${data.summary.growth.toFixed(1)}% growth compared to last quarter

View your analytics dashboard: https://photovault.photo/photographers/analytics

Questions? Contact us at support@photovault.photo

---
This quarterly report was automatically generated by PhotoVault.
    `.trim()
  }

  private generateYearlyReportText(data: EmailReportData): string {
    return `
PhotoVault Annual Revenue Report
${data.businessName || data.photographerName}
Year: ${this.formatYear(data.period.start)}

YEAR IN REVIEW:
- Annual Revenue: $${this.formatCurrency(data.summary.totalRevenue)}
- Total Clients: ${data.summary.totalClients}
- Monthly Recurring: $${this.formatCurrency(data.summary.monthlyRecurring)}
- Annual Growth: ${data.summary.growth >= 0 ? '+' : ''}${data.summary.growth.toFixed(1)}%

YEAR HIGHLIGHTS:
• $${this.formatCurrency(data.summary.totalRevenue)} total commission earned this year
• ${data.summary.totalClients} clients generating revenue
• $${this.formatCurrency(data.summary.monthlyRecurring)} monthly recurring passive income
• ${data.summary.growth >= 0 ? '+' : ''}${data.summary.growth.toFixed(1)}% growth compared to last year

View your full analytics: https://photovault.photo/photographers/analytics

Thank you for using PhotoVault this year!

Questions? Contact us at support@photovault.photo

---
This annual report was automatically generated by PhotoVault.
    `.trim()
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  private formatPeriod(start: string, end: string): string {
    const startDate = new Date(start)
    const endDate = new Date(end)
    
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  private formatYear(dateString: string): string {
    return new Date(dateString).getFullYear().toString()
  }
}

// Default email configuration (should be moved to environment variables)
export const defaultEmailConfig: EmailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
}
