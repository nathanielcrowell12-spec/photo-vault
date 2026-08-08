import { Card, CardContent } from '@/components/ui/card'

export interface FaqItem {
  question: string
  answer: string
}

/**
 * Renders an FAQ block and is the single source for the FAQPage JSON-LD on the same
 * page — pass the same array to `buildFaqSchema` so the markup and the structured data
 * can never drift apart.
 */
export function buildFaqSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((f) => (
        <Card key={f.question}>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2 text-lg">{f.question}</h3>
            <p className="text-muted-foreground">{f.answer}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
