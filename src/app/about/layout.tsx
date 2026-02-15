import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About PhotoVault | Memory Insurance for Families",
  description:
    "PhotoVault turns every photoshoot into passive income for photographers while giving families a permanent home for their professional photos. Learn our story.",
  openGraph: {
    type: "website",
    title: "About PhotoVault | Memory Insurance for Families",
    description:
      "The only platform combining professional photo delivery, long-term family archival, and photographer passive income.",
    url: "https://photovault.photo/about",
    siteName: "PhotoVault",
  },
  alternates: {
    canonical: "https://photovault.photo/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
