import type { Metadata } from "next";

// The page itself is a client component and cannot export metadata, so the
// canonical lives here. Without it the page inherits no self-referencing
// canonical at all (flagged by the 2026-08-07 on-page crawl).
export const metadata: Metadata = {
  title: "Photographer Commission — Earn 50% on Every Client | PhotoVault",
  description:
    "How PhotoVault photographer commissions work: earn 50% of every client storage payment, paid out through Stripe Connect. See the earnings breakdown.",
  alternates: {
    canonical: "https://www.photovault.photo/photographers/commission-details",
  },
};

export default function CommissionDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
