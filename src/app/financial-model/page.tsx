import React from 'react'

export default function FinancialModelPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            PhotoVault Financial Model
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Revenue Streams</h2>
            
            <h3 className="text-xl font-semibold text-blue-600 mb-4">1. Photographer Subscription Fee</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-700">
              <li><strong>$22/month per photographer</strong></li>
              <li>Platform access, unlimited galleries, analytics, commission tracking</li>
              <li>Cancel anytime</li>
            </ul>

            <h3 className="text-xl font-semibold text-blue-600 mb-4">2. Client Payments (Split with Photographers)</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-700">
              <li><strong>Year 1:</strong> $100 upfront (PhotoVault gets $50, Photographer gets $50)</li>
              <li><strong>Year 2+:</strong> $8/month ongoing (PhotoVault gets $4, Photographer gets $4)</li>
            </ul>

            <h3 className="text-xl font-semibold text-blue-600 mb-4">3. Reactivation Revenue (PhotoVault keeps 100%)</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-700">
              <li><strong>Inactive clients:</strong> PhotoVault keeps all $8/month from reactivated galleries</li>
              <li><strong>New photographer sessions:</strong> PhotoVault keeps $50, new photographer gets $50, original photographer keeps $4/month recurring</li>
            </ul>

            <hr className="my-8 border-gray-300" />

            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Financial Scenarios</h2>

            <div className="grid gap-8">
              {/* Small Market Launch */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">Scenario 1: Small Market Launch (50 Photographers)</h3>
                
                <h4 className="font-semibold text-gray-700 mb-3">Assumptions:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>50 photographers @ $22/month = <strong>$1,100/month</strong></li>
                  <li>Average 10 clients per photographer = 500 total clients</li>
                  <li>80% client activation rate = 400 active clients</li>
                </ul>

                <h4 className="font-semibold text-gray-700 mb-3">Month 1 Revenue:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Photographer subscriptions:</strong> 50 × $22 = $1,100</li>
                  <li><strong>Client upfront payments:</strong> 400 × $50 = $20,000</li>
                  <li><strong>Total Month 1:</strong> $21,100</li>
                </ul>

                <h4 className="font-semibold text-gray-700 mb-3">Year 1 Revenue:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Photographer subscriptions:</strong> $1,100 × 12 = $13,200</li>
                  <li><strong>Client upfront payments:</strong> $20,000 (one-time)</li>
                  <li><strong>Total Year 1:</strong> $33,200</li>
                </ul>

                <h4 className="font-semibold text-gray-700 mb-3">Year 2 Ongoing Monthly Revenue:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Photographer subscriptions:</strong> $1,100/month</li>
                  <li><strong>Client recurring:</strong> 400 × $4 = $1,600/month</li>
                  <li><strong>Total Monthly:</strong> $2,700/month</li>
                  <li><strong>Total Year 2:</strong> $32,400</li>
                </ul>

                <h4 className="font-semibold text-gray-700 mb-3">3-Year Projection:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Year 1:</strong> $33,200</li>
                  <li><strong>Year 2:</strong> $32,400</li>
                  <li><strong>Year 3:</strong> $32,400 (assuming stable client base)</li>
                  <li><strong>3-Year Total:</strong> $98,000</li>
                </ul>
              </div>

              {/* Medium Market Growth */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-xl font-semibold text-green-800 mb-4">Scenario 2: Medium Market Growth (200 Photographers)</h3>
                
                <h4 className="font-semibold text-gray-700 mb-3">Assumptions:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>200 photographers @ $22/month = <strong>$4,400/month</strong></li>
                  <li>Average 15 clients per photographer = 3,000 total clients</li>
                  <li>75% client activation rate = 2,250 active clients</li>
                </ul>

                <h4 className="font-semibold text-gray-700 mb-3">Month 1 Revenue:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Photographer subscriptions:</strong> 200 × $22 = $4,400</li>
                  <li><strong>Client upfront payments:</strong> 2,250 × $50 = $112,500</li>
                  <li><strong>Total Month 1:</strong> $116,900</li>
                </ul>

                <h4 className="font-semibold text-gray-700 mb-3">Year 1 Revenue:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Photographer subscriptions:</strong> $4,400 × 12 = $52,800</li>
                  <li><strong>Client upfront payments:</strong> $112,500 (one-time)</li>
                  <li><strong>Total Year 1:</strong> $165,300</li>
                </ul>

                <h4 className="font-semibold text-gray-700 mb-3">Year 2 Ongoing Monthly Revenue:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Photographer subscriptions:</strong> $4,400/month</li>
                  <li><strong>Client recurring:</strong> 2,250 × $4 = $9,000/month</li>
                  <li><strong>Total Monthly:</strong> $13,400/month</li>
                  <li><strong>Total Year 2:</strong> $160,800</li>
                </ul>

                <h4 className="font-semibold text-gray-700 mb-3">3-Year Projection:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Year 1:</strong> $165,300</li>
                  <li><strong>Year 2:</strong> $160,800</li>
                  <li><strong>Year 3:</strong> $160,800</li>
                  <li><strong>3-Year Total:</strong> $486,900</li>
                </ul>
              </div>

              {/* Large City Saturation */}
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <h3 className="text-xl font-semibold text-purple-800 mb-4">Scenario 3: Large City Saturation (500 Photographers)</h3>
                
                <h4 className="font-semibold text-gray-700 mb-3">Assumptions:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>500 photographers @ $22/month = <strong>$11,000/month</strong></li>
                  <li>Average 20 clients per photographer = 10,000 total clients</li>
                  <li>70% client activation rate = 7,000 active clients</li>
                </ul>

                <h4 className="font-semibold text-gray-700 mb-3">Month 1 Revenue:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Photographer subscriptions:</strong> 500 × $22 = $11,000</li>
                  <li><strong>Client upfront payments:</strong> 7,000 × $50 = $350,000</li>
                  <li><strong>Total Month 1:</strong> $361,000</li>
                </ul>

                <h4 className="font-semibold text-gray-700 mb-3">Year 1 Revenue:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Photographer subscriptions:</strong> $11,000 × 12 = $132,000</li>
                  <li><strong>Client upfront payments:</strong> $350,000 (one-time)</li>
                  <li><strong>Total Year 1:</strong> $482,000</li>
                </ul>

                <h4 className="font-semibold text-gray-700 mb-3">Year 2 Ongoing Monthly Revenue:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Photographer subscriptions:</strong> $11,000/month</li>
                  <li><strong>Client recurring:</strong> 7,000 × $4 = $28,000/month</li>
                  <li><strong>Total Monthly:</strong> $39,000/month</li>
                  <li><strong>Total Year 2:</strong> $468,000</li>
                </ul>

                <h4 className="font-semibold text-gray-700 mb-3">3-Year Projection:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Year 1:</strong> $482,000</li>
                  <li><strong>Year 2:</strong> $468,000</li>
                  <li><strong>Year 3:</strong> $468,000</li>
                  <li><strong>3-Year Total:</strong> $1,418,000</li>
                </ul>
              </div>

              {/* Multi-City Expansion */}
              <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                <h3 className="text-xl font-semibold text-orange-800 mb-4">Scenario 4: Multi-City Expansion (1,000 Photographers)</h3>
                
                <h4 className="font-semibold text-gray-700 mb-3">Assumptions:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>1,000 photographers @ $22/month = <strong>$22,000/month</strong></li>
                  <li>Average 25 clients per photographer = 25,000 total clients</li>
                  <li>65% client activation rate = 16,250 active clients</li>
                </ul>

                <h4 className="font-semibold text-gray-700 mb-3">Month 1 Revenue:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Photographer subscriptions:</strong> 1,000 × $22 = $22,000</li>
                  <li><strong>Client upfront payments:</strong> 16,250 × $50 = $812,500</li>
                  <li><strong>Total Month 1:</strong> $834,500</li>
                </ul>

                <h4 className="font-semibold text-gray-700 mb-3">Year 1 Revenue:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Photographer subscriptions:</strong> $22,000 × 12 = $264,000</li>
                  <li><strong>Client upfront payments:</strong> $812,500 (one-time)</li>
                  <li><strong>Total Year 1:</strong> $1,076,500</li>
                </ul>

                <h4 className="font-semibold text-gray-700 mb-3">Year 2 Ongoing Monthly Revenue:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Photographer subscriptions:</strong> $22,000/month</li>
                  <li><strong>Client recurring:</strong> 16,250 × $4 = $65,000/month</li>
                  <li><strong>Total Monthly:</strong> $87,000/month</li>
                  <li><strong>Total Year 2:</strong> $1,044,000</li>
                </ul>

                <h4 className="font-semibold text-gray-700 mb-3">3-Year Projection:</h4>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Year 1:</strong> $1,076,500</li>
                  <li><strong>Year 2:</strong> $1,044,000</li>
                  <li><strong>Year 3:</strong> $1,044,000</li>
                  <li><strong>3-Year Total:</strong> $3,164,500</li>
                </ul>
              </div>
            </div>

            <hr className="my-8 border-gray-300" />

            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Revenue Summary by Scenario</h2>
            
            <div className="overflow-x-auto mb-8">
              <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Scenario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Photographers</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Year 1 Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Year 2 Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Year 3 Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">3-Year Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Small Launch</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">50</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$33,200</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$32,400</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$32,400</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$98,000</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Medium Growth</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">200</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$165,300</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$160,800</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$160,800</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$486,900</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Large City</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">500</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$482,000</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$468,000</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$468,000</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$1,418,000</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Multi-City</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1,000</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$1,076,500</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$1,044,000</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$1,044,000</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$3,164,500</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <hr className="my-8 border-gray-300" />

            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Key Insights</h2>
            
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">Why This Model Works:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Dual Revenue Streams:</strong> Photographer subscriptions provide stable baseline revenue, while client payments offer high-margin growth</li>
                <li><strong>Incredible Unit Economics:</strong> LTV/CAC ratio of 19.9x with 84.6% gross margin</li>
                <li><strong>Network Effects:</strong> More photographers attract more clients, creating a virtuous cycle</li>
                <li><strong>Competitive Advantage:</strong> Similar pricing to competitors but photographers EARN money instead of just spending it</li>
                <li><strong>Scalability:</strong> Low variable costs (~$0.85/month per client) enable profitable scaling</li>
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Next Steps:</h3>
              <ol className="list-decimal pl-6 text-gray-700 space-y-2">
                <li>Launch in single city (Portland)</li>
                <li>Achieve 50-100 photographers (proof of concept)</li>
                <li>Optimize conversion and retention</li>
                <li>Expand to additional cities</li>
                <li>Scale to national presence</li>
              </ol>
              
              <p className="mt-4 text-gray-700 font-medium">
                <strong>The $22/month photographer fee transforms PhotoVault from a commission-only model to a stable, scalable SaaS business with multiple revenue streams and exceptional unit economics.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


