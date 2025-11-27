import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ViewProvider } from "@/contexts/ViewContext";
import { Navigation, Footer } from "@/components/navigation";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "Find and Keep Your Photos Forever | PhotoVault",
  description: "PhotoVault helps you find, organize, and save every professional photo ever taken — all in one secure family gallery.",
  keywords: "find my photos, photo storage, photo gallery login, family photo vault, organize photos online, download professional photos",
  openGraph: {
    type: "website",
    title: "Find and Keep Every Photo You Love — Forever | PhotoVault",
    description: "All your photographer galleries, together in one private dashboard. Simple. Secure. Free to start.",
    url: "https://photovault.com",
    siteName: "PhotoVault",
    images: [
      {
        url: "https://photovault.com/images/og-consumer.webp",
        width: 1200,
        height: 630,
        alt: "PhotoVault - Find and Keep Your Photos Forever",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find and Keep Every Photo You Love — Forever | PhotoVault",
    description: "All your photographer galleries, together in one private dashboard. Simple. Secure. Free to start.",
    images: ["https://photovault.com/images/og-consumer.webp"],
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
    canonical: "https://photovault.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://photovault.com/" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["WebSite", "Service"],
              name: "PhotoVault",
              url: "https://photovault.com/",
              description: "PhotoVault helps families find, organize, and keep every professional photo in one secure dashboard.",
              serviceType: "Photo retrieval and storage platform",
              offers: {
                "@type": "Offer",
                priceCurrency: "USD",
                price: "0",
              },
              areaServed: "United States",
              sameAs: [
                "https://www.facebook.com/PhotoVault",
                "https://www.instagram.com/PhotoVault",
              ],
              mainEntityOfPage: {
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "Is PhotoVault free?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes. You can start for free and add storage later if needed.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Can I upload my own photos?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes. You can import photos from your device or connect existing galleries.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "How secure is my data?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "PhotoVault uses encrypted cloud storage and never sells or shares your images.",
                    },
                  },
                ],
              },
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ViewProvider>
            <div className="flex flex-col min-h-screen">
              <Navigation hideOnPaths={['/photographer/dashboard']} />
              <main className="flex-1">
                {children}
              </main>
              <Footer hideOnPaths={['/photographer/dashboard']} />
              <Toaster />
            </div>
          </ViewProvider>
        </AuthProvider>
      </body>
    </html>
  );
}