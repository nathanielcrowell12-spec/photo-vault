import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Gallery Retention Platform for Photographers | PhotoVault",
  description: "Stop losing clients to expiring galleries. PhotoVault gives photographers permanent client storage, engagement automation, and referral income.",
  keywords: "client gallery retention, photo delivery platform for photographers, permanent client galleries, photographer referral program, client photo storage",
  openGraph: {
    type: "website",
    title: "Keep Clients Engaged Forever | PhotoVault for Photographers",
    description: "Permanent client galleries, automated reminders, and referral revenue for photographers.",
    url: "https://photovault.photo/photographers",
    siteName: "PhotoVault for Photographers",
    images: [
      {
        url: "https://photovault.photo/images/og-photographer.webp",
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
    images: ["https://photovault.photo/images/og-photographer.webp"],
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
    canonical: "https://photovault.photo/photographers",
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
            "@type": ["SoftwareApplication", "Service"],
            name: "PhotoVault",
            url: "https://photovault.photo/photographers",
            description: "PhotoVault helps photographers earn passive income from completed work. Clients pay for photo storage, photographers earn 50% commission.",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web, Windows",
            areaServed: "United States",
            serviceType: "Photo delivery and archival platform",
            offers: {
              "@type": "Offer",
              priceCurrency: "USD",
              price: "22",
              priceValidUntil: "2027-12-31",
              url: "https://photovault.photo/photographers",
              description: "Photographer platform subscription",
            },
            sameAs: [
              "https://www.instagram.com/PhotoVault",
              "https://www.facebook.com/PhotoVault",
            ],
            mainEntityOfPage: {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How does PhotoVault help photographers?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "PhotoVault stores client galleries permanently, automates engagement, and generates referral income.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Do I keep ownership of my photos?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes, photographers retain full copyright and control. Clients only access approved galleries.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is there a referral program?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes, photographers earn commission for every client who renews through PhotoVault.",
                  },
                },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  );
}
