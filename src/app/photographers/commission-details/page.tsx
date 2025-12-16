'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  DollarSign, 
  Users, 
  TrendingUp, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calculator,
  Target
} from 'lucide-react'
import Link from 'next/link'

export default function CommissionDetailsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/photographers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Photographer Page
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Guardian Earnings
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Earn While You Protect Family Memories
            </h1>
            <p className="text-xl text-muted-foreground dark:text-foreground max-w-3xl mx-auto">
              You're not just a photographer—you're the guardian of your clients' family history. Here's how you earn passive income while delivering Memory Insurance.
            </p>
          </div>

          {/* Quick Summary */}
          <Card className="mb-8 border-2 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-6 w-6 text-green-600" />
                <span>Guardian Earnings Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-2">$50</div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">Upfront Earnings</p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">When family activates Memory Insurance ($100)</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">$4/mo</div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">Passive Income</p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">For every family you protect (Year 2+)</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-2">$22/mo</div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">Guardian Platform Fee</p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">Unlimited families, unlimited protection</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Different Scenarios */}
          <Tabs defaultValue="basic" className="mb-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Flow</TabsTrigger>
              <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
              <TabsTrigger value="calculator">Calculator</TabsTrigger>
              <TabsTrigger value="rules">Full Rules</TabsTrigger>
            </TabsList>

            {/* Basic Flow Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>The Guardian Earnings Flow</CardTitle>
                  <CardDescription>How you earn while protecting a family's memories</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 font-bold">1</div>
                      <div>
                        <h3 className="font-semibold mb-1">You Capture Their Family History</h3>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Wedding, newborn, family portrait—you're creating irreplaceable memories. These photos can never be retaken.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 font-bold">2</div>
                      <div>
                        <h3 className="font-semibold mb-1">Family Activates Memory Insurance ($100)</h3>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-2">You deliver their photos to PhotoVault—a digital safety deposit box. First year of protection is built into your package.</p>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm">
                          <strong>You Earn: $50 upfront</strong>
                          <br />You're now their guardian—they trust you with their family history
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 font-bold">3</div>
                      <div>
                        <h3 className="font-semibold mb-1">Family Continues Protection (Year 2+)</h3>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-2">For $8/month—the price of one coffee—their memories stay protected from hard drive failures.</p>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
                          <strong>You Earn: $4/month passive income</strong>
                          <br />For every family you protect, forever
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 font-bold">4</div>
                      <div>
                        <h3 className="font-semibold mb-1">Your Guardian Platform Fee</h3>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-2">Unlimited families, unlimited memories, unlimited protection.</p>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-sm">
                          <strong>Your Cost: $22/month</strong>
                          <br />Covered by just 6 protected families
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg">
                    <h3 className="font-semibold mb-4">Example: First Protected Family</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Family activates Memory Insurance:</span>
                        <span className="font-semibold">$100</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>You earn as their guardian:</span>
                        <span className="font-semibold">+$50</span>
                      </div>
                      <div className="flex justify-between text-purple-600">
                        <span>Your monthly platform fee:</span>
                        <span className="font-semibold">-$22</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Net profit first month:</span>
                        <span className="text-green-600">+$28</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scenarios Tab */}
            <TabsContent value="scenarios" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Real-World Scenarios</CardTitle>
                  <CardDescription>See exactly how commissions work in different situations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Scenario 1 */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-lg mb-2 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      Scenario 1: New Client, Active for 2 Years
                    </h3>
                    <div className="space-y-3 text-sm">
                      <p className="text-muted-foreground dark:text-muted-foreground">Sarah books a wedding, stays active with PhotoVault for 2 years.</p>
                      
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-2">
                        <div><strong>Year 1:</strong></div>
                        <div className="ml-4">
                          <div>• Client pays: $100</div>
                          <div className="text-green-600">• You earn: $50 upfront</div>
                        </div>
                        
                        <div><strong>Year 2:</strong></div>
                        <div className="ml-4">
                          <div>• Client pays: $8/month × 12 = $96</div>
                          <div className="text-green-600">• You earn: $4/month × 12 = $48</div>
                        </div>

                        <Separator />
                        <div className="flex justify-between font-bold">
                          <span>Total earnings over 2 years:</span>
                          <span className="text-green-600">$98</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Minus platform fees (24 months × $22):</span>
                          <span className="text-purple-600">-$528</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          *Platform fee covers ALL clients, this is just one client&apos;s contribution
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scenario 2 */}
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="font-semibold text-lg mb-2 flex items-center">
                      <RefreshCw className="h-5 w-5 text-orange-500 mr-2" />
                      Scenario 2: Client Goes Inactive, Then Returns
                    </h3>
                    <div className="space-y-3 text-sm">
                      <p className="text-muted-foreground dark:text-muted-foreground">Mike&apos;s family stops paying after year 1, then books another session 6 months later with you (same photographer).</p>
                      
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-2">
                        <div><strong>Initial Session (Year 1):</strong></div>
                        <div className="ml-4">
                          <div>• Client pays: $100</div>
                          <div className="text-green-600">• You earn: $50 upfront</div>
                        </div>
                        
                        <div><strong>Account Inactive (6 months):</strong></div>
                        <div className="ml-4">
                          <div>• No payments from client</div>
                          <div>• No commission for you</div>
                          <div>• Photos stay safely stored</div>
                        </div>

                        <div><strong>New Session (18 months later):</strong></div>
                        <div className="ml-4">
                          <div>• Client pays: $100 again (reactivation)</div>
                          <div className="text-green-600">• You earn: $50 upfront again</div>
                          <div className="text-blue-600">• Commission cycle restarts</div>
                        </div>

                        <Separator />
                        <div className="flex justify-between font-bold">
                          <span>Total earnings:</span>
                          <span className="text-green-600">$100 ($50 + $50)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scenario 3 */}
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-lg mb-2 flex items-center">
                      <Users className="h-5 w-5 text-blue-500 mr-2" />
                      Scenario 3: Client Switches to Different Photographer
                    </h3>
                    <div className="space-y-3 text-sm">
                      <p className="text-muted-foreground dark:text-muted-foreground">Jennifer was your client, goes inactive, then books with a different PhotoVault photographer.</p>
                      
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-2">
                        <div><strong>You (Original Photographer):</strong></div>
                        <div className="ml-4">
                          <div>• Year 1: Client pays $100</div>
                          <div className="text-green-600">• You earn: $50 upfront</div>
                        </div>
                        
                        <div><strong>Client Inactive:</strong></div>
                        <div className="ml-4">
                          <div>• 6 months of no payments</div>
                        </div>

                        <div><strong>New Photographer Books Client:</strong></div>
                        <div className="ml-4">
                          <div>• Client pays: $100 to PhotoVault</div>
                          <div className="text-green-600">• New photographer earns: $50 upfront</div>
                          <div className="text-blue-600">• PhotoVault keeps: $50</div>
                          <div className="text-orange-600">• You keep: $4/month recurring forever!</div>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg mt-2">
                          <strong className="text-orange-700 dark:text-orange-300">Network Effect Bonus:</strong>
                          <div className="text-xs mt-1">Even though the client switched photographers, you still earn $4/month for life as the original referring photographer! This encourages building a local photographer network.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scenario 4 */}
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-semibold text-lg mb-2 flex items-center">
                      <TrendingUp className="h-5 w-5 text-purple-500 mr-2" />
                      Scenario 4: Building a Client Base (25 Clients)
                    </h3>
                    <div className="space-y-3 text-sm">
                      <p className="text-muted-foreground dark:text-muted-foreground">You build up 25 active clients over your first year.</p>
                      
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-2">
                        <div><strong>Year 1 Revenue:</strong></div>
                        <div className="ml-4">
                          <div>• 25 clients × $50 upfront = <span className="text-green-600 font-semibold">$1,250</span></div>
                        </div>
                        
                        <div><strong>Year 2 Revenue (if all stay active):</strong></div>
                        <div className="ml-4">
                          <div>• 25 clients × $4/month × 12 = <span className="text-green-600 font-semibold">$1,200/year</span></div>
                          <div>• Or <span className="text-green-600 font-semibold">$100/month</span> passive income</div>
                        </div>

                        <div><strong>Your Costs:</strong></div>
                        <div className="ml-4">
                          <div>• Platform fee: $22/month × 12 = <span className="text-purple-600">$264/year</span></div>
                        </div>

                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Year 2 Net Profit:</span>
                          <span className="text-green-600">$936</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Plus you continue booking new clients for more upfront commissions!
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Calculator Tab */}
            <TabsContent value="calculator" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-6 w-6 text-blue-600" />
                    <span>Commission Calculator</span>
                  </CardTitle>
                  <CardDescription>Calculate your potential earnings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                    <h3 className="font-semibold mb-4">Quick Math Examples</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="font-semibold mb-2">10 Clients Scenario:</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground dark:text-muted-foreground">Year 1 Upfront:</div>
                            <div className="text-xl font-bold text-green-600">$500</div>
                            <div className="text-xs text-muted-foreground">10 × $50</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground dark:text-muted-foreground">Year 2 Monthly:</div>
                            <div className="text-xl font-bold text-blue-600">$40/mo</div>
                            <div className="text-xs text-muted-foreground">10 × $4/mo</div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <div className="font-semibold mb-2">25 Clients Scenario:</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground dark:text-muted-foreground">Year 1 Upfront:</div>
                            <div className="text-xl font-bold text-green-600">$1,250</div>
                            <div className="text-xs text-muted-foreground">25 × $50</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground dark:text-muted-foreground">Year 2 Monthly:</div>
                            <div className="text-xl font-bold text-blue-600">$100/mo</div>
                            <div className="text-xs text-muted-foreground">25 × $4/mo</div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <div className="font-semibold mb-2">50 Clients Scenario:</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground dark:text-muted-foreground">Year 1 Upfront:</div>
                            <div className="text-xl font-bold text-green-600">$2,500</div>
                            <div className="text-xs text-muted-foreground">50 × $50</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground dark:text-muted-foreground">Year 2 Monthly:</div>
                            <div className="text-xl font-bold text-blue-600">$200/mo</div>
                            <div className="text-xs text-muted-foreground">50 × $4/mo</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                    <h3 className="font-semibold mb-4">Break-Even Analysis</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <strong>Your Platform Cost:</strong> $22/month ($264/year)
                      </div>
                      <div>
                        <strong>To Break Even with Recurring Revenue:</strong>
                        <div className="ml-4 mt-1">
                          $22/month ÷ $4/client = <span className="font-semibold text-purple-600">6 active clients needed</span>
                        </div>
                      </div>
                      <div>
                        <strong>With 6+ Active Clients:</strong>
                        <div className="ml-4 mt-1">
                          Platform fee covered + profit on every additional client
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-3 rounded mt-4">
                        <div className="text-xs text-muted-foreground mb-2">Example: 10 active clients</div>
                        <div>Revenue: 10 × $4 = $40/month</div>
                        <div>Cost: $22/month</div>
                        <div className="font-bold text-green-600 mt-1">Profit: $18/month passive</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Full Rules Tab */}
            <TabsContent value="rules" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Complete Commission Rules</CardTitle>
                  <CardDescription>Every rule and policy explained</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        Standard Commission Structure
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground dark:text-muted-foreground ml-7">
                        <li>• <strong>First Year:</strong> Client pays $100 to PhotoVault. Photographer receives $50 upfront commission, PhotoVault keeps $50.</li>
                        <li>• <strong>Year 2+:</strong> Client pays $8/month. Photographer receives $4/month, PhotoVault keeps $4/month.</li>
                        <li>• <strong>Platform Fee:</strong> Photographer pays $22/month for unlimited clients and galleries.</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <RefreshCw className="h-5 w-5 text-orange-500 mr-2" />
                        Reactivation Rules
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground dark:text-muted-foreground ml-7">
                        <li>• <strong>Reactivation with New Session:</strong> If client becomes inactive and then books a new session with the <strong>same photographer</strong>, the commission cycle restarts completely.</li>
                        <li className="ml-4">→ Photographer receives another $50 upfront commission when client pays $100 again.</li>
                        <li className="ml-4">→ This encourages re-booking previous clients.</li>
                        <li>• <strong>Reactivation Without New Session:</strong> If client goes inactive (after 12 months paid + 6 month grace period) and wants to reactivate their account <strong>without booking a new photoshoot</strong>:</li>
                        <li className="ml-4 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">→ Client pays $20 reactivation fee to PhotoVault</li>
                        <li className="ml-4 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">→ Then $8/month payments resume</li>
                        <li className="ml-4 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">→ Standard commission split applies ($10 from reactivation, $4/month ongoing)</li>
                        <li className="ml-4 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">→ <strong>Photographer never loses the customer</strong> - you keep earning commission</li>
                        <li>• <strong>Payment During Grace Period:</strong> If client is in grace period (4 months into the 6-month grace) and resumes paying $8/month, no back pay is due. Monthly payments simply restart from that point forward.</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <Users className="h-5 w-5 text-blue-500 mr-2" />
                        Cross-Photographer Rules
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground dark:text-muted-foreground ml-7">
                        <li>• If client becomes inactive and books with a <strong>different PhotoVault photographer</strong>:</li>
                        <li className="ml-4">→ New photographer gets $50 upfront commission from the $100 payment</li>
                        <li className="ml-4">→ PhotoVault keeps $50</li>
                        <li className="ml-4">→ <strong>Original photographer keeps $4/month recurring commission forever</strong></li>
                        <li>• This creates a network effect where photographers benefit from the local photo ecosystem.</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                        Special Cases
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground dark:text-muted-foreground ml-7">
                        <li>• <strong>Family Accounts:</strong> One login per family, unlimited galleries. If no photographer, family pays $8/month directly to PhotoVault with no commission.</li>
                        <li className="ml-4 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">→ <strong>Family-to-Photographer Conversion:</strong> If a family without a photographer later books a session with a PhotoVault photographer, PhotoVault&apos;s $8/month stops. The standard commission rules apply - photographer gets $50 upfront when client pays $100, then $4/month recurring. The family is now associated with the photographer.</li>
                        <li>• <strong>Multi-Gallery Customers:</strong> This is the core feature - customers collect photos from multiple photographers in one account. Each photographer gets their commission structure independently.</li>
                        <li>• <strong>Photographer Termination:</strong> If you stop using PhotoVault, your clients become PhotoVault clients. They keep their photos, you lose future commissions.</li>
                        <li>• <strong>Billing Disputes:</strong> You handle disputes first. If refund required, loss is shared 50/50 between you and PhotoVault.</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                        Payment Processing
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground dark:text-muted-foreground ml-7">
                        <li>• PhotoVault handles <strong>all billing</strong> - you never process client payments</li>
                        <li>• Automated payment reminders sent to clients</li>
                        <li>• Commissions paid out to your account monthly</li>
                        <li>• Platform fee ($22/month) auto-deducted from your commissions or charged separately if needed</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                        Undefined Scenarios & Dispute Resolution
                      </h3>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                          Any scenarios not explicitly defined in these rules will be worked through collaboratively by all involved parties (client, photographer, and PhotoVault). 
                        </p>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-2">
                          <strong>PhotoVault has final decision-making authority</strong> in disputes or unclear situations. Once resolved, a new rule will be added to these terms to account for similar situations in the future.
                        </p>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-2">
                          This ensures the system evolves fairly and transparently based on real-world use cases.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="font-semibold text-xl mb-3">The Guardian Bottom Line</h3>
                    <p className="text-muted-foreground dark:text-muted-foreground mb-6 max-w-2xl mx-auto">
                      You earn $50 upfront per family, then $4/month passive income for every family you protect.
                      With just 6 protected families, your platform fee is covered—everything else is profit while you safeguard their irreplaceable memories.
                    </p>
                    <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                      <Link href="/photographers/signup">
                        <DollarSign className="h-5 w-5 mr-2" />
                        Become a Guardian
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* CTA Section */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-800">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Ready to Become a Guardian?</h2>
                <p className="text-muted-foreground dark:text-muted-foreground mb-6 max-w-2xl mx-auto">
                  You're not just delivering photos—you're protecting irreplaceable memories while building passive income. That's what being a Guardian means.
                </p>
                <div className="flex justify-center">
                  <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                    <Link href="/photographers/signup">
                      Start Protecting Memories
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

