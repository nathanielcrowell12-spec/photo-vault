import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | PhotoVault",
  description:
    "PhotoVault terms of service covering photographer agreements, client subscriptions, photo storage, cancellation policies, and the Orphan Protocol.",
  openGraph: {
    type: "website",
    title: "Terms of Service | PhotoVault",
    description:
      "PhotoVault terms covering subscriptions, photo storage, and photographer agreements.",
    url: "https://photovault.photo/terms",
    siteName: "PhotoVault",
  },
  alternates: {
    canonical: "https://photovault.photo/terms",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
