import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact PhotoVault | Get in Touch",
  description:
    "Have questions about PhotoVault? Contact our team for support with photo storage, photographer accounts, or partnership inquiries.",
  openGraph: {
    type: "website",
    title: "Contact PhotoVault",
    description:
      "Get in touch with the PhotoVault team for support, partnerships, or questions about our photo storage platform.",
    url: "https://photovault.photo/contact",
    siteName: "PhotoVault",
  },
  alternates: {
    canonical: "https://photovault.photo/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
