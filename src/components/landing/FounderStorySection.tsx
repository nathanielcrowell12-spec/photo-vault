interface FounderStorySectionProps {
  betaEmail: string
}

export function FounderStorySection({ betaEmail }: FounderStorySectionProps) {
  return (
    <section className="py-16 md:py-24 bg-secondary" aria-label="Founder story">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Built by a dad who got tired of losing his family&apos;s photos.
          </h2>

          <div className="mt-6 space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            <p>
              I&apos;m Nate. I live in Brooklyn, Wisconsin, and I built PhotoVault because
              I watched my family&apos;s photos scatter across dead hard drives, expired
              cloud links, and forgotten USB sticks.
            </p>
            <p>
              When I talked to photographers, I realized the same thing was happening
              to their clients. And the platforms that were supposed to help were charging
              photographers more while letting galleries expire.
            </p>
            <p>
              PhotoVault flips that. Photographers earn from their work. Clients keep
              their memories. Nobody loses.
            </p>
            <p className="text-foreground font-medium">
              This isn&apos;t a VC-funded startup. It&apos;s a sustainable business built to last.
              I&apos;m looking for founding photographers to help shape it.
            </p>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Questions? Email{' '}
            <a
              href={`mailto:${betaEmail}`}
              className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
            >
              {betaEmail}
            </a>{' '}
            directly.
          </p>
        </div>
      </div>
    </section>
  )
}
