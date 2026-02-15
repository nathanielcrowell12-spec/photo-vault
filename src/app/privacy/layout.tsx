import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | PhotoVault",
  description:
    "PhotoVault privacy policy. Learn how we protect your photos and personal data with enterprise-grade encryption and strict access controls.",
  openGraph: {
    type: "website",
    title: "Privacy Policy | PhotoVault",
    description:
      "How PhotoVault protects your photos and personal data.",
    url: "https://photovault.photo/privacy",
    siteName: "PhotoVault",
  },
  alternates: {
    canonical: "https://photovault.photo/privacy",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
