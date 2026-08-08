import type { Metadata } from "next";

// The page itself is a client component and cannot export metadata, so the
// canonical lives here. Without it the page inherits no self-referencing
// canonical at all (flagged by the 2026-08-07 on-page crawl).
export const metadata: Metadata = {
  title: "Sign Up as a Photographer | PhotoVault",
  description:
    "Create your PhotoVault photographer account. Deliver client galleries that never expire and earn 50% commission on every client payment. Free during beta.",
  alternates: {
    canonical: "https://www.photovault.photo/photographers/signup",
  },
};

export default function PhotographerSignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
