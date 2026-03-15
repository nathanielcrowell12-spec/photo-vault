import { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import { Calendar, Clock, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Madison Photography Business Blog | PhotoVault',
  description: 'Practical advice on photography business finances, pricing, permits, and logistics in Madison, Wisconsin.',
  openGraph: {
    type: 'website',
    title: 'Madison Photography Business Blog | PhotoVault',
    description: 'Practical advice on photography business finances, pricing, permits, and logistics in Madison, Wisconsin.',
    url: 'https://www.photovault.photo/blog',
    siteName: 'PhotoVault',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Madison Photography Business Blog | PhotoVault',
    description: 'Practical advice on photography business finances, pricing, permits, and logistics in Madison, Wisconsin.',
  },
  alternates: {
    canonical: 'https://www.photovault.photo/blog',
  },
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://www.photovault.photo',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
    },
  ],
}

const blogSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'PhotoVault Blog',
  description: 'Practical advice on photography business finances, pricing, permits, and logistics in Madison, Wisconsin.',
  url: 'https://www.photovault.photo/blog',
  publisher: {
    '@type': 'Organization',
    name: 'PhotoVault LLC',
    url: 'https://www.photovault.photo',
  },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            The Madison Photography Business Blog
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Practical advice on finances, pricing, permits, and logistics for
            running a photography business in Madison, Wisconsin.
          </p>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <p className="text-muted-foreground">No posts yet. Check back soon.</p>
        ) : (
          <div className="space-y-8">
            {posts.map(post => (
              <article
                key={post.slug}
                className="group border border-border rounded-lg p-6 hover:border-primary/30 transition-colors"
              >
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                    {post.title}
                  </h2>
                </Link>

                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {post.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{post.readingTime}</span>
                    </div>
                  </div>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                  >
                    Read more
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
