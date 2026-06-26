// ─── Types partagés pour esm-home-app ────────────────────────────────────────

export interface PricingTier {
  id: string;
  name: string;
  price: number | null;
  currency: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
  badge?: string;
}

export interface FeatureItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  tag?: string;
}

export interface UseCaseItem {
  id: string;
  title: string;
  description: string;
  audience: string;
  features: string[];
  icon: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  organization: string;
  avatar?: string;
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
  suffix?: string;
}

export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}
