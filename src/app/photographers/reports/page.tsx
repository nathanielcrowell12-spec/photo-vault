'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Download,
  Mail,
  FileText,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings
} from 'lucide-react'
import Link from 'next/link'

interface ReportHistory {
  id: string
  type: 'monthly' | 'quarterly' | 'yearly' | 'custom'
  period_start: string
  period_end: string
  status: 'completed' | 'processing' | 'failed'
  created_at: string
  download_url?: string
}

export default function ReportsPage() {
  const { user, userType } = useAuth()
  const router = useRouter()
  const [reportHistory, setReportHistory] = useState<ReportHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null)
  
  // Report generation form
  const [reportType, setReportType] = useState<'monthly' | 'quarterly' | 'yearly' | 'custom'>('monthly')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [includeAnalytics, setIncludeAnalytics] = useState(true)
  const [includePDF, setIncludePDF] = useState(true)
  const [emailAddress, setEmailAddress] = useState('')

  useEffect(() => {
    if (userType !== 'photographer') {
      router.push('/dashboard')
      return
    }
    fetchReportHistory()
    setDefaultDates()
  }, [userType, router])

  // Show loading or redirect if not photographer
  if (userType !== 'photographer') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  const setDefaultDates = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(lastDay.toISOString().split('T')[0])
  }

  const fetchReportHistory = async () => {
    try {
      // Fetch report history from API
      // For now, return empty array until report generation is implemented
      // This will be populated when Stripe integration is complete
      setReportHistory([])
    } catch (error) {
      console.error('Error fetching report history:', error)
      setReportHistory([])
    }
  }

  const generateReport = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photographer_id: user?.id,
          report_type: reportType,
          start_date: startDate,
          end_date: endDate,
          include_analytics: includeAnalytics
        })
      })

      const data = await response.json()

      if (data.success) {
        // Download the PDF
        const pdfBlob = new Blob([Buffer.from(data.data.pdf_base64, 'base64')], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(pdfBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.data.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // Refresh report history
        fetchReportHistory()
      } else {
        alert('Failed to generate report: ' + data.error)
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const sendEmailReport = async () => {
    setEmailLoading(true)
    try {
      const response = await fetch('/api/reports/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photographer_id: user?.id,
          report_type: reportType,
          start_date: startDate,
          end_date: endDate,
          include_pdf: includePDF,
          email_address: emailAddress || user?.email
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Email report sent successfully!')
      } else {
        alert('Failed to send email report: ' + data.error)
      }
    } catch (error) {
      console.error('Error sending email report:', error)
      alert('Failed to send email report')
    } finally {
      setEmailLoading(false)
    }
  }

  const downloadReport = async (reportId: string) => {
    setDownloadLoading(reportId)
    try {
      // Simulate download - in real implementation, this would download from server
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Report downloaded successfully!')
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('Failed to download report')
    } finally {
      setDownloadLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    
    if (startDate.getFullYear() === endDate.getFullYear()) {
      return `${startDate.toLocaleDateString('en-US', { month: 'short' })} - ${endDate.toLocaleDateString('en-US', { month: 'short' })} ${startDate.getFullYear()}`
    } else {
      return `${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/photographers/revenue">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Revenue
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">Reports & Analytics</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
              Professional
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="generate" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generate">Generate Report</TabsTrigger>
              <TabsTrigger value="email">Email Reports</TabsTrigger>
              <TabsTrigger value="history">Report History</TabsTrigger>
            </TabsList>

            {/* Generate Report Tab */}
            <TabsContent value="generate">
              <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Download className="h-5 w-5 text-green-600" />
                      <span>Generate Report</span>
                    </CardTitle>
                    <CardDescription>
                      Create and download detailed revenue reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="report-type">Report Type</Label>
                      <Select value={reportType} onValueChange={(value: string) => setReportType(value as 'monthly' | 'quarterly' | 'yearly' | 'custom')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly Report</SelectItem>
                          <SelectItem value="quarterly">Quarterly Report</SelectItem>
                          <SelectItem value="yearly">Yearly Report</SelectItem>
                          <SelectItem value="custom">Custom Period</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="include-analytics"
                          checked={includeAnalytics}
                          onChange={(e) => setIncludeAnalytics(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="include-analytics">Include Growth Analytics</Label>
                      </div>
                    </div>

                    <Button 
                      onClick={generateReport} 
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Generating Report...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Generate & Download PDF
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span>Report Preview</span>
                    </CardTitle>
                    <CardDescription>
                      What&apos;s included in your report
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Executive Summary</h4>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            Total revenue, active clients, and key metrics
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Revenue Breakdown</h4>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            Upfront vs recurring commission analysis
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Transaction Details</h4>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            Recent commission payments and client activity
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Top Earning Clients</h4>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            Your highest revenue generating clients
                          </p>
                        </div>
                      </div>

                      {includeAnalytics && (
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Growth Analytics</h4>
                            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                              Growth metrics and trend analysis
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Email Reports Tab */}
            <TabsContent value="email">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-purple-600" />
                    <span>Email Reports</span>
                  </CardTitle>
                  <CardDescription>
                    Send automated reports directly to your email
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email-address">Email Address</Label>
                    <Input
                      id="email-address"
                      type="email"
                      placeholder={user?.email || "your-email@example.com"}
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                      Leave empty to use your account email: {user?.email}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-report-type">Report Type</Label>
                      <Select value={reportType} onValueChange={(value: string) => setReportType(value as 'monthly' | 'quarterly' | 'yearly' | 'custom')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly Report</SelectItem>
                          <SelectItem value="quarterly">Quarterly Report</SelectItem>
                          <SelectItem value="yearly">Yearly Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-period">Period</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-pdf"
                      checked={includePDF}
                      onChange={(e) => setIncludePDF(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="include-pdf">Include PDF attachment</Label>
                  </div>

                  <Button 
                    onClick={sendEmailReport} 
                    disabled={emailLoading}
                    className="w-full"
                  >
                    {emailLoading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Sending Email...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Report History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <span>Report History</span>
                  </CardTitle>
                  <CardDescription>
                    View and download your previously generated reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportHistory.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium capitalize">{report.type} Report</h3>
                            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                              {formatPeriod(report.period_start, report.period_end)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Generated {formatDate(report.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {report.status === 'completed' && (
                            <>
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ready
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadReport(report.id)}
                                disabled={downloadLoading === report.id}
                              >
                                {downloadLoading === report.id ? (
                                  <Clock className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                          {report.status === 'processing' && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              <Clock className="h-3 w-3 mr-1 animate-spin" />
                              Processing
                            </Badge>
                          )}
                          {report.status === 'failed' && (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
