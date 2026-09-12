import type { Metadata } from "next";
import HeroTool from "@/components/HeroTool";
import ToolGrid from "@/components/ToolGrid";
import TriangleField from "@/components/TriangleField";
import { site } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `${site.name} — Free Developer Tools That Run in Your Browser`,
  description: site.description,
  alternates: { canonical: "/" },
};

const claims = [
  {
    k: "privacy",
    h: "Nothing is uploaded",
    p: "Every tool runs in your browser with the Web Crypto and Encoding APIs. Open the Network tab and watch nothing happen.",
  },
  {
    k: "focus",
    h: "One tool, One page",
    p: "No dashboard, no account, no modal asking for your email. The URL you land on is the tool, already focused.",
  },
  {
    k: "speed",
    h: "Loads before you blink",
    p: "Static pages on a CDN, no framework waterfall, no ad script blocking the input. Under a second, every time.",
  },
];

export default function HomePage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: site.name,
            url: site.url,
            description: site.description,
            publisher: { "@type": "Organization", name: site.brand },
          }),
        }}
      />

      <section className="relative">
        <TriangleField />
        <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-10 sm:px-10 sm:pb-20 sm:pt-16">
          <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-teal">
            ten tools · zero uploads
          </p>

          <h1 className="mt-6 max-w-[16ch] font-display text-[54px] font-bold leading-[0.94] tracking-[-0.045em] text-white sm:text-[86px]">
            Your data never leaves this tab.
          </h1>

          <p className="mt-7 max-w-[52ch] text-[17px] leading-relaxed text-muted">
            Free developer tools that run entirely in your browser. No sign-up, no server, no
            waiting. Start with the one below, then take the other nine.
          </p>

          <div className="mt-12 overflow-hidden">
            <HeroTool />
          </div>
        </div>
      </section>

      <section id="tools" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 pb-6 sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-line pt-12">
            <h2 className="font-display text-[34px] font-bold tracking-[-0.035em] text-white sm:text-[44px]">
              The Full Set
            </h2>
            <p className="font-mono text-[13px] text-muted">
              <span className="text-teal">●</span> All Ten Live
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-20 sm:px-10">
          <ToolGrid />
        </div>
      </section>

      <section id="why" className="scroll-mt-20 bg-facet-1">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 sm:px-10 md:grid-cols-3">
          {claims.map((c) => (
            <div key={c.k}>
              <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-teal">
                {c.k}
              </span>
              <h3 className="mt-4 font-display text-[22px] font-medium tracking-[-0.02em] text-white">
                {c.h}
              </h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{c.p}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
