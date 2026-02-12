import { Camera, Send, DollarSign, ArrowRight } from 'lucide-react'

const steps = [
  {
    icon: Camera,
    title: 'Shoot and edit as normal',
    description:
      'Nothing changes about your workflow. Shoot your sessions and edit your photos like you always do.',
  },
  {
    icon: Send,
    title: 'Deliver through PhotoVault',
    description:
      'Upload the gallery and send a delivery email. Your client\'s profile is created automatically. Choose the right payment option\u2014shoot fees and storage bundled into one price.',
  },
  {
    icon: DollarSign,
    title: 'Get paid upfront and ongoing',
    description:
      'You keep 100% of your shoot fees and 50% of storage fees\u2014we cover all Stripe processing costs. When prepaid plans end, monthly billing starts automatically. Built-in passive income.',
  },
]

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-16 md:py-24 bg-secondary"
      aria-label="How it works"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            How Photographers Earn with PhotoVault
          </h2>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground">
            Three steps. Then the income runs itself.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-10 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="bg-card rounded-lg border border-border p-6 sm:p-8 text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <step.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Step {index + 1}
              </p>
              <h3 className="text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Money Flow Diagram */}
        <div className="mt-10 md:mt-12 max-w-2xl mx-auto">
          <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-sm sm:text-base">
              <span className="font-medium text-foreground whitespace-nowrap">
                Client pays
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" aria-hidden="true" />
              <span className="text-muted-foreground sm:hidden" aria-hidden="true">&darr;</span>
              <span className="bg-primary/10 text-primary font-semibold px-3 py-1 rounded-md whitespace-nowrap">
                PhotoVault
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" aria-hidden="true" />
              <span className="text-muted-foreground sm:hidden" aria-hidden="true">&darr;</span>
              <span className="font-medium text-foreground whitespace-nowrap">
                50% to you via Stripe
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground text-center">
              Upfront and monthly &mdash; you earn on every payment your client makes.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
