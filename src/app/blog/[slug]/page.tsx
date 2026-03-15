import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import Image from 'next/image'
import { getAllPosts, getPostBySlug } from '@/lib/blog'
import { Calendar, Clock, ArrowLeft, User } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map(post => ({ slug: post.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    return { title: 'Post Not Found' }
  }

  const url = `https://www.photovault.photo/blog/${post.slug}`

  return {
    title: `${post.title} | PhotoVault Blog`,
    description: post.description,
    keywords: post.tags.join(', '),
    authors: [{ name: post.author }],
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url,
      siteName: 'PhotoVault',
      publishedTime: post.date,
      modifiedTime: post.updatedDate || post.date,
      authors: [post.author],
      ...(post.ogImage && {
        images: [{ url: post.ogImage, width: 1200, height: 630, alt: post.title }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      ...(post.ogImage && { images: [post.ogImage] }),
    },
    alternates: {
      canonical: url,
    },
  }
}

// Custom MDX components — override <img> with Next.js Image for CSP compliance
const mdxComponents = {
  img: (props: React.ComponentProps<'img'>) => {
    const { src, alt, ...rest } = props
    if (!src || typeof src !== 'string') return null
    // For self-hosted images, use Next.js Image
    if (src.startsWith('/')) {
      return (
        <Image
          src={src}
          alt={alt || ''}
          width={800}
          height={450}
          className="rounded-lg my-6"
        />
      )
    }
    // External images fall through to regular img (must be CSP-allowed)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt || ''} {...rest} className="rounded-lg my-6" />
  },
  a: (props: React.ComponentProps<'a'>) => {
    const { href, children, ...rest } = props
    if (href?.startsWith('/') || href?.startsWith('https://photovault.photo') || href?.startsWith('https://www.photovault.photo')) {
      return <Link href={href} {...rest}>{children}</Link>
    }
    return <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>
  },
  table: (props: React.ComponentProps<'table'>) => (
    <div className="not-prose my-8 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  thead: (props: React.ComponentProps<'thead'>) => (
    <thead className="bg-muted/50 border-b border-border" {...props} />
  ),
  th: (props: React.ComponentProps<'th'>) => (
    <th style={{ padding: '12px 24px' }} className="text-left font-semibold text-foreground" {...props} />
  ),
  td: (props: React.ComponentProps<'td'>) => (
    <td style={{ padding: '12px 24px' }} className="text-muted-foreground border-t border-border/50" {...props} />
  ),
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const url = `https://www.photovault.photo/blog/${post.slug}`

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
        item: 'https://www.photovault.photo/blog',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
      },
    ],
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'PhotoVault LLC',
      url: 'https://www.photovault.photo',
    },
    datePublished: post.date,
    dateModified: post.updatedDate || post.date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    keywords: post.tags,
    ...(post.ogImage && { image: post.ogImage }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article className="max-w-2xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Blog
          </Link>
        </nav>

        {/* Header */}
        <header className="mb-10">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight mb-4">
            {post.title}
          </h1>

          <p className="text-lg text-muted-foreground mb-6">
            {post.description}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b border-border pb-6">
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{post.readingTime}</span>
            </div>
          </div>
        </header>

        {/* MDX Content */}
        <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:text-2xl prose-h2:mt-14 prose-h2:mb-6
          prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-4
          prose-p:text-base prose-p:leading-[1.85] prose-p:mb-6 prose-p:text-muted-foreground
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-strong:text-foreground
          prose-li:text-muted-foreground prose-li:leading-[1.85] prose-li:mb-2
          prose-ul:my-6 prose-ol:my-6
          prose-table:text-sm prose-table:my-8
          prose-th:text-left prose-th:font-semibold prose-th:text-foreground prose-th:py-3 prose-th:px-4
          prose-td:text-muted-foreground prose-td:py-3 prose-td:px-4
          prose-hr:border-border prose-hr:my-10
          prose-blockquote:border-primary prose-blockquote:text-muted-foreground prose-blockquote:my-8
          prose-em:text-foreground/80
        ">
          <MDXRemote source={post.content} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
        </div>

        {/* Author CTA */}
        <div className="mt-12 p-6 rounded-lg bg-card border border-border">
          <p className="text-sm font-medium text-foreground mb-2">About PhotoVault</p>
          <p className="text-sm text-muted-foreground mb-4">
            PhotoVault is a professional gallery platform for photographers and their clients.
            Photographers pay $22/month for unlimited galleries, unlimited clients, and unlimited uploads.
            Clients pay $8/month to keep their galleries active — photographers earn $4/month from each subscription.
          </p>
          <Link
            href="/photographers"
            className="text-sm font-medium text-primary hover:underline"
          >
            Learn how Madison photographers are building passive income →
          </Link>
        </div>
      </article>
    </>
  )
}
