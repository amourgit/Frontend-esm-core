import { Benefits } from './benefits';
import { FAQ } from './faq';
import { Footer } from './footer';
import { Hero } from './hero';
import { Insights } from './insights';
import { LogoStrip } from './logo-strip';
import { Metrics } from './metrics';
import { Nav } from './nav';
import { Newsletter } from './newsletter';
import { Pricing } from './pricing';
import { Testimonials } from './testimonials';

export default function MarketingDemo() {
  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-7xl px-5 py-2 lg:px-8">
        <p className="text-muted-foreground text-xs">
          Marketing blocks from{' '}
          <a
            href="https://shadcncraft.com?atp=tweakcn&src=marketing-preview"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground underline underline-offset-4"
          >
            shadcncraft Pro
          </a>
        </p>
      </div>

      <Nav />
      <Hero />
      <LogoStrip />
      <Benefits />
      <Testimonials />
      <Metrics />
      <Pricing />
      <Insights />
      <FAQ />
      <Newsletter />
      <Footer />
    </div>
  );
}
