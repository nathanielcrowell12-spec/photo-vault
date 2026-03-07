import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Camera, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  Clock,
  Shield,
  Users
} from "lucide-react";
import { PAYMENT_OPTIONS, COMMISSION_RULES } from "@/lib/payment-models";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-pink-600" />
              <span className="text-xl font-bold">PhotoVault Terms</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Terms of Service & Commission Structure</h1>
            <p className="text-lg text-muted-foreground dark:text-foreground">
              Please read these terms carefully. By using PhotoVault, you agree to these terms and our commission structure.
            </p>
          </div>

          {/* Business Model */}
          <Card className="mb-8 border-2 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                <span>PhotoVault Business Model</span>
              </CardTitle>
              <CardDescription>
                Three packages, one flat platform fee &mdash; pick what fits your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  💰 Three Storage Packages &mdash; Pick What Fits Your Business
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                  Every photographer runs their business differently. PhotoVault gives you three commission-earning
                  packages to offer clients &mdash; from a full year of prepaid storage down to a low-commitment
                  trial. You always earn 50%. All three transition to $8/month after the prepaid period
                  (except the trial, which simply expires).
                </p>

                {/* Year Package */}
                <div className="mb-4">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 text-sm uppercase tracking-wide">
                    Year Package &mdash; Best Value
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm text-green-700 dark:text-green-300">
                    <div className="text-center border border-green-300 dark:border-green-700 rounded-lg p-3">
                      <div className="text-lg font-bold">Platform Fee</div>
                      <div className="text-2xl font-bold">$22/month</div>
                      <p>Photographer pays</p>
                      <div className="mt-2 text-xs">
                        <p>Unlimited galleries</p>
                        <p>Advanced analytics</p>
                        <p>Commission tracking</p>
                      </div>
                    </div>
                    <div className="text-center border border-green-300 dark:border-green-700 rounded-lg p-3">
                      <div className="text-lg font-bold">Year 1</div>
                      <div className="text-2xl font-bold">$100</div>
                      <p>Client pays upfront</p>
                      <div className="mt-2 text-xs">
                        <p>Photographer: $50</p>
                        <p>PhotoVault: $50</p>
                      </div>
                    </div>
                    <div className="text-center border border-green-300 dark:border-green-700 rounded-lg p-3">
                      <div className="text-lg font-bold">Year 2+</div>
                      <div className="text-2xl font-bold">$8/month</div>
                      <p>Client pays ongoing</p>
                      <div className="mt-2 text-xs">
                        <p>Photographer: $4/month</p>
                        <p>PhotoVault: $4/month</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-xs text-green-600 dark:text-green-400 mt-2">
                    You earn $50 upfront + $4/month passive income after the first year
                  </p>
                </div>

                {/* 6-Month Package */}
                <div className="mb-4">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 text-sm uppercase tracking-wide">
                    6-Month Package &mdash; Lower Entry Point
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm text-green-700 dark:text-green-300">
                    <div className="text-center border border-green-300 dark:border-green-700 rounded-lg p-3">
                      <div className="text-lg font-bold">Platform Fee</div>
                      <div className="text-2xl font-bold">$22/month</div>
                      <p>Photographer pays</p>
                      <div className="mt-2 text-xs">
                        <p>Same platform access</p>
                        <p>Same features</p>
                      </div>
                    </div>
                    <div className="text-center border border-green-300 dark:border-green-700 rounded-lg p-3">
                      <div className="text-lg font-bold">First 6 Months</div>
                      <div className="text-2xl font-bold">$50</div>
                      <p>Client pays upfront</p>
                      <div className="mt-2 text-xs">
                        <p>Photographer: $25</p>
                        <p>PhotoVault: $25</p>
                      </div>
                    </div>
                    <div className="text-center border border-green-300 dark:border-green-700 rounded-lg p-3">
                      <div className="text-lg font-bold">Month 7+</div>
                      <div className="text-2xl font-bold">$8/month</div>
                      <p>Client pays ongoing</p>
                      <div className="mt-2 text-xs">
                        <p>Photographer: $4/month</p>
                        <p>PhotoVault: $4/month</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-xs text-green-600 dark:text-green-400 mt-2">
                    You earn $25 upfront + $4/month passive income after six months
                  </p>
                </div>

                {/* 6-Month Trial */}
                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 text-sm uppercase tracking-wide">
                    6-Month Trial &mdash; Lowest Commitment
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm text-green-700 dark:text-green-300">
                    <div className="text-center border border-green-300 dark:border-green-700 rounded-lg p-3">
                      <div className="text-lg font-bold">Platform Fee</div>
                      <div className="text-2xl font-bold">$22/month</div>
                      <p>Photographer pays</p>
                      <div className="mt-2 text-xs">
                        <p>Same platform access</p>
                        <p>Same features</p>
                      </div>
                    </div>
                    <div className="text-center border border-green-300 dark:border-green-700 rounded-lg p-3">
                      <div className="text-lg font-bold">6 Months</div>
                      <div className="text-2xl font-bold">$20</div>
                      <p>Client pays one-time</p>
                      <div className="mt-2 text-xs">
                        <p>Photographer: $10</p>
                        <p>PhotoVault: $10</p>
                      </div>
                    </div>
                    <div className="text-center border border-green-300 dark:border-green-700 rounded-lg p-3">
                      <div className="text-lg font-bold">After 6 Months</div>
                      <div className="text-2xl font-bold">Expires</div>
                      <p>No auto-billing</p>
                      <div className="mt-2 text-xs">
                        <p>Client can upgrade anytime</p>
                        <p>or download and go</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-xs text-green-600 dark:text-green-400 mt-2">
                    You earn $10 &mdash; ideal for price-sensitive clients who want to try before they commit
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">For Photographers</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground dark:text-foreground">
                    <li>• Replace Pixieset, ShootProof, SmugMug with PhotoVault</li>
                    <li>• Earn $50 upfront + $4/month passive income per client</li>
                    <li>• No payment processing needed - PhotoVault handles billing</li>
                    <li>• Professional CMS integration ready</li>
                    <li>• Better client retention than competitors</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">For PhotoVault</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground dark:text-foreground">
                    <li>• $50 upfront + $4/month per active client</li>
                    <li>• Immediate revenue from upfront payments</li>
                    <li>• Scalable monthly recurring revenue</li>
                    <li>• Professional CMS integration when ready</li>
                    <li>• Database designed for easy software transfer</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  🔧 Professional CMS Integration Ready
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm mb-2">
                  PhotoVault is designed to integrate with professional photographer CMS software when appropriate for scaling.
                </p>
                <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                  <li>• Database schema compatible with professional CMS systems</li>
                  <li>• API endpoints ready for third-party integration</li>
                  <li>• Easy data migration and transfer capabilities</li>
                  <li>• Scalable architecture for enterprise deployment</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Commission Structure */}
          <Card className="mb-8 border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                <span>Photographer Commission Structure</span>
              </CardTitle>
              <CardDescription>
                How photographers earn revenue and commission rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Commission Rules Summary
                </h3>
                <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                  <li>• <strong>Platform Fee:</strong> Photographers pay $22/month</li>
                  <li>• <strong>Year 1:</strong> Client pays $100 upfront → Photographer gets $50 commission</li>
                  <li>• <strong>Year 2+:</strong> Client pays $8/month ongoing → Photographer gets $4/month passive commission</li>
                  <li>• PhotoVault handles all billing - no payment processing needed</li>
                  <li>• Replaces photographer&apos;s existing photo sharing software</li>
                  <li>• Commission stops if client gallery is inactive for 6+ months</li>
                  <li>• <strong>NEW SESSION RULE:</strong> New photo session resets commission cycle</li>
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Commission Applies</span>
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground dark:text-foreground">
                    <li>• <strong>Photographer-billed monthly ($4/month commission)</strong></li>
                    <li>• 6-month trial subscriptions ($10 commission)</li>
                    <li>• Direct client monthly subscriptions ($4/month commission)</li>
                    <li>• <strong>New photo sessions with inactive clients</strong></li>
                    <li>• Commission continues for client lifetime (ongoing monthly)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span>No Commission</span>
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground dark:text-foreground">
                    <li>• Reactivated galleries after 6+ months</li>
                    <li>• Clients who stopped paying for 6+ months</li>
                    <li>• Any gallery inactive for 6+ months</li>
                    <li>• Reactivation payments ($8/month)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Options */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Payment Options & Pricing</CardTitle>
              <CardDescription>
                Available payment methods for PhotoVault access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {PAYMENT_OPTIONS.filter(option => option.id !== 'reactivated_gallery').map((option, index) => (
                  <div key={option.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{option.name}</h3>
                        <p className="text-muted-foreground dark:text-foreground">{option.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">${option.price}</div>
                        <div className="text-sm text-muted-foreground">
                          {option.duration === 12 ? 'per year' : option.duration === 6 ? 'for 6 months' : 'per month'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <Badge variant={option.photographer_commission > 0 ? "default" : "secondary"}>
                        {option.photographer_commission}% Commission
                      </Badge>
                      <Badge variant="outline">
                        {option.duration} months
                      </Badge>
                      <Badge variant="outline">
                        Reactivation: ${option.reactivation_fee}/month
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <h4 className="font-medium text-sm mb-2">Terms:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground dark:text-foreground">
                        {option.terms.map((term, termIndex) => (
                          <li key={termIndex}>• {term}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* New Session Rule */}
          <Card className="mb-8 border-2 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-green-600" />
                <span>New Session Rule - Commission Reset</span>
              </CardTitle>
              <CardDescription>
                Important rule that incentivizes long-term photographer-client relationships
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  🎯 Commission Reset Rule
                </h3>
                <p className="text-green-700 dark:text-green-300 mb-3">
                  If a client becomes inactive (stops paying for 6+ months) but then books a NEW photo session with the same photographer, 
                  the commission cycle RESETS and the photographer earns 50% commission again.
                </p>
                <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <p><strong>Example Scenario:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>1. Client pays for PhotoVault access → Photographer earns 50% commission</li>
                    <li>2. Client stops paying for 8 months → Gallery becomes inactive, no commission</li>
                    <li>3. Client books new wedding session → Commission cycle RESETS</li>
                    <li>4. Client reactivates PhotoVault → Photographer earns 50% commission again</li>
                  </ul>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Benefits for Photographers</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground dark:text-foreground">
                    <li>• Incentive to maintain client relationships</li>
                    <li>• Reward for bringing clients back</li>
                    <li>• Commission resets with new sessions</li>
                    <li>• Long-term client retention benefits</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Benefits for PhotoVault</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground dark:text-foreground">
                    <li>• Photographers motivated to re-engage clients</li>
                    <li>• Higher client retention rates</li>
                    <li>• More active subscriptions</li>
                    <li>• Win-win partnership model</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inactivity Rules */}
          <Card className="mb-8 border-2 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-6 w-6 text-orange-600" />
                <span>Gallery Inactivity Rules</span>
              </CardTitle>
              <CardDescription>
                Important rules about gallery inactivity and reactivation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                  Critical Inactivity Rules
                </h3>
                <ul className="space-y-2 text-sm text-orange-700 dark:text-orange-300">
                  <li><strong>6-Month Rule:</strong> If a client stops paying for 6+ months, their gallery becomes inactive</li>
                  <li><strong>Commission Cutoff:</strong> Photographer commission stops after 6 months of client inactivity</li>
                  <li><strong>Reactivation Ownership:</strong> Reactivated galleries after 6+ months belong to PhotoVault</li>
                  <li><strong>Reactivation Fee:</strong> Clients must pay $8/month to reactivate inactive galleries</li>
                  <li><strong>No Back Commission:</strong> Photographers do not receive commission on reactivated galleries</li>
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">For Photographers</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground dark:text-foreground">
                    <li>• Include PhotoVault access in your package pricing</li>
                    <li>• Earn 50% commission on active client subscriptions</li>
                    <li>• Commission stops after 6 months of client inactivity</li>
                    <li>• Encourage clients to maintain active subscriptions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">For Clients</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground dark:text-foreground">
                    <li>• Gallery becomes inactive after 6 months of non-payment</li>
                    <li>• Pay $8/month to reactivate inactive galleries</li>
                    <li>• Reactivated galleries have no photographer commission</li>
                    <li>• Maintain active subscription to keep gallery accessible</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Terms */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <span>Legal Terms & Conditions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Service Agreement</h3>
                <p className="text-sm text-muted-foreground dark:text-foreground mb-4">
                  By using PhotoVault, you agree to these terms and our commission structure. 
                  These terms may be updated, and continued use constitutes acceptance.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Commission Structure Agreement</h3>
                <p className="text-sm text-muted-foreground dark:text-foreground mb-4">
                  Photographers acknowledge and agree that:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground dark:text-foreground ml-4">
                  <li>• Commission rates are subject to change with 30 days notice</li>
                  <li>• Commission stops after 6 months of client inactivity</li>
                  <li>• Reactivated galleries belong to PhotoVault</li>
                  <li>• No commission applies to reactivated galleries</li>
                  <li>• Commission is paid monthly for active subscriptions</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Client Payment Agreement</h3>
                <p className="text-sm text-muted-foreground dark:text-foreground mb-4">
                  Clients acknowledge and agree that:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground dark:text-foreground ml-4">
                  <li>• Gallery access requires active subscription</li>
                  <li>• Gallery becomes inactive after 6 months of non-payment</li>
                  <li>• Reactivation requires $8/month payment</li>
                  <li>• Photos remain stored but inaccessible when inactive</li>
                  <li>• Payment methods may be updated as needed</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Data & Privacy</h3>
                <p className="text-sm text-muted-foreground dark:text-foreground mb-4">
                  PhotoVault respects your privacy and protects your photos with bank-level security. 
                  We never sell or share your photos with third parties.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Questions About These Terms?</CardTitle>
              <CardDescription>
                Contact us if you have questions about our commission structure or terms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-foreground">
                    Email: legal@photovault.photo
                  </p>
                  <p className="text-sm text-muted-foreground dark:text-foreground">
                    Last updated: {new Date().toLocaleDateString()}
                  </p>
                </div>
                <Button asChild>
                  <Link href="/contact">
                    Contact Us
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
