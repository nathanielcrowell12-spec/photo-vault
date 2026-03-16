import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Gallery Retention Platform for Photographers | PhotoVault",
  description: "Stop losing clients to expiring galleries. PhotoVault gives photographers permanent client storage, engagement automation, and referral income.",
  keywords: "client gallery retention, photo delivery platform for photographers, permanent client galleries, photographer referral program, client photo storage",
  openGraph: {
    type: "website",
    title: "Keep Clients Engaged Forever | PhotoVault for Photographers",
    description: "Permanent client galleries, automated reminders, and referral revenue for photographers.",
    url: "https://www.photovault.photo/photographers",
    siteName: "PhotoVault for Photographers",
    images: [
      {
        url: "https://www.photovault.photo/images/og-photographer.webp",
        width: 1200,
        height: 630,
        alt: "PhotoVault for Photographers - Client Gallery Retention Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Keep Clients Engaged Forever | PhotoVault for Photographers",
    description: "Permanent client galleries, automated reminders, and referral revenue for photographers.",
    images: ["https://www.photovault.photo/images/og-photographer.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.photovault.photo/photographers",
  },
};

export default function PhotographersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareApplication",
                name: "PhotoVault",
                url: "https://www.photovault.photo/photographers",
                description: "Gallery delivery platform for photographers with passive income. Clients pay for storage, photographers earn 50% commission.",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web, Windows",
                offers: {
                  "@type": "Offer",
                  priceCurrency: "USD",
                  price: "22",
                  priceValidUntil: "2027-12-31",
                  url: "https://www.photovault.photo/photographers",
                  description: "Monthly platform fee. Free during beta.",
                  availability: "https://schema.org/InStock",
                },
                provider: {
                  "@type": "Organization",
                  name: "PhotoVault LLC",
                  url: "https://www.photovault.photo",
                },
                featureList: [
                  "Unlimited gallery uploads",
                  "50% commission on every client payment",
                  "Desktop app for large gallery uploads",
                  "Automated client email sequences",
                  "Stripe Connect direct deposit",
                  "Analytics and revenue tracking",
                ],
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: "https://www.photovault.photo" },
                  { "@type": "ListItem", position: 2, name: "For Photographers", item: "https://www.photovault.photo/photographers" },
                ],
              },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
