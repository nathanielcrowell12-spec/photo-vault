import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, X, Crown, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface PricingPlan {
  name: string
  price: string
  period: string
  features: string[]
  commission?: string
  isPhotoVault?: boolean
  cta?: string
  ctaLink?: string
}

const plans: PricingPlan[] = [
  {
    name: 'Pixieset',
    price: '$20',
    period: '/month',
    features: [
      'Unlimited galleries',
      'Client galleries',
      'Mobile app',
      'Print sales',
      'Watermarking',
      'Basic analytics'
    ],
    commission: 'No commission program'
  },
  {
    name: 'ShootProof',
    price: '$25',
    period: '/month',
    features: [
      'Unlimited galleries',
      'Client galleries',
      'Mobile app',
      'Print sales',
      'Contracts',
      'Basic reporting'
    ],
    commission: 'No commission program'
  },
  {
    name: 'SmugMug',
    price: '$30',
    period: '/month',
    features: [
      'Unlimited galleries',
      'Client galleries',
      'Mobile app',
      'Print sales',
      'Website builder',
      'SEO tools'
    ],
    commission: 'No commission program'
  },
  {
    name: 'PhotoVault',
    price: '$22',
    period: '/month',
    features: [
      'Unlimited galleries',
      'Client galleries',
      'Mobile app',
      'Advanced analytics',
      'PDF reports',
      'Commission tracking',
      'Professional CMS integration',
      'Cancel anytime'
    ],
    commission: '$50 upfront + $4/month per client',
    isPhotoVault: true,
    cta: 'Become a Guardian',
    ctaLink: '/photographers/signup'
  }
]

export function PricingComparison() {
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">How PhotoVault Compares</h2>
        <p className="text-xl text-muted-foreground dark:text-foreground">
          Get more features and earn money with every client
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {plans.map((plan, index) => (
          <Card 
            key={plan.name} 
            className={`relative ${plan.isPhotoVault ? 'border-2 border-green-500 shadow-lg' : 'border'}`}
          >
            {plan.isPhotoVault && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-green-600 text-foreground px-4 py-1">
                  <Crown className="h-3 w-3 mr-1" />
                  Best Value
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground dark:text-muted-foreground">{plan.period}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Commission Program */}
              {plan.commission && (
                <div className={`p-3 rounded-lg text-center text-sm ${
                  plan.isPhotoVault 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                    : 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400'
                }`}>
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">Commission Program</span>
                  </div>
                  <div className={plan.isPhotoVault ? 'text-green-700 dark:text-green-300' : 'text-gray-500'}>
                    {plan.commission}
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="space-y-2">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {plan.cta && plan.ctaLink && (
                <Button 
                  asChild 
                  className={`w-full mt-6 ${
                    plan.isPhotoVault 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-secondary hover:bg-secondary'
                  }`}
                >
                  <Link href={plan.ctaLink}>
                    {plan.cta}
                  </Link>
                </Button>
              )}

              {/* ROI Calculation */}
              {plan.isPhotoVault && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Break-even point
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      5.5 clients
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      (5.5 × $4/month = $22/month)
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 text-center">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-2">Why Choose PhotoVault?</h3>
          <p className="text-muted-foreground dark:text-foreground mb-4">
            While competitors charge $20-30/month with no earning potential, PhotoVault charges $22/month 
            but you earn $50 + $4/month on every client. With just 6 clients, you&apos;re making more than you pay!
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-green-600">$22/month</div>
              <div className="text-muted-foreground dark:text-muted-foreground">Platform cost</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-blue-600">$50 + $4/month</div>
              <div className="text-muted-foreground dark:text-muted-foreground">Per client earned</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-purple-600">6 clients</div>
              <div className="text-muted-foreground dark:text-muted-foreground">Break-even point</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
