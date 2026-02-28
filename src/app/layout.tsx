import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ViewProvider } from "@/contexts/ViewContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navigation, Footer } from "@/components/navigation";
import { Toaster } from "@/components/ui/toaster";
import { PostHogProvider } from "@/app/providers/PostHogProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "Find and Keep Your Photos Forever | PhotoVault",
  description: "PhotoVault helps you find, organize, and save every professional photo ever taken — all in one secure family gallery.",
  openGraph: {
    type: "website",
    title: "Find and Keep Every Photo You Love — Forever | PhotoVault",
    description: "All your photographer galleries, together in one private dashboard. Simple. Secure. Free to start.",
    url: "https://www.photovault.photo",
    siteName: "PhotoVault",
    images: [
      {
        url: "https://www.photovault.photo/images/og-consumer.webp",
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
    images: ["https://www.photovault.photo/images/og-consumer.webp"],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} bg-background text-foreground overflow-x-hidden`}>
        <PostHogProvider>
          <ThemeProvider>
            <AuthProvider>
              <ViewProvider>
                {/* Root-level error boundary - catches catastrophic errors */}
                <ErrorBoundary level="root">
                  <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
                    <Navigation hideOnPaths={['/', '/photographer/dashboard', '/login', '/signup', '/auth/signup', '/photographers/signup']} />
                    {/* Route-level error boundary - preserves navigation on page errors */}
                    <main className="flex-1 overflow-x-hidden">
                      <RouteErrorBoundary>
                        {children}
                      </RouteErrorBoundary>
                    </main>
                    <Footer hideOnPaths={['/', '/photographer/dashboard', '/login', '/signup', '/auth/signup', '/photographers/signup']} />
                    <Toaster />
                  </div>
                </ErrorBoundary>
              </ViewProvider>
            </AuthProvider>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}