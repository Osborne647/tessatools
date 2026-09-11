import type { Metadata } from "next";
import CssTool from "@/components/CssTool";
import Breadcrumb from "@/components/Breadcrumb";
import Faq from "@/components/Faq";
import RelatedTools from "@/components/RelatedTools";
import TriangleField from "@/components/TriangleField";
import { faqJsonLd, getTool, site, toolJsonLd } from "@/lib/site-config";

// Server component. It owns metadata and structured data; the interactive part
// is isolated in <CssTool />, the page's only client bundle.
const tool = getTool("css-minifier")!;

export const metadata: Metadata = {
  title: tool.h1,
  description: tool.metaDescription,
  keywords: [
    tool.keyword,
    "minify css online",
    "css compressor",
    "css beautifier",
    "compress stylesheet",
  ],
  alternates: { canonical: `/tools/${tool.slug}/` },
  openGraph: {
    type: "website",
    url: `${site.url}/tools/${tool.slug}/`,
    title: tool.h1,
    description: tool.metaDescription,
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: tool.h1,
    description: tool.metaDescription,
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Tools", item: `${site.url}/` },
    { "@type": "ListItem", position: 2, name: tool.name, item: `${site.url}/tools/${tool.slug}/` },
  ],
};

export default function CssPage() {
  return (
    <main>
      {/* Three schemas: what the app is, the FAQ (feeds AI Overviews), and
          where the page sits in the site. */}
      {[toolJsonLd(tool), faqJsonLd(tool.faqs), breadcrumbJsonLd].map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <section className="relative">
        <TriangleField />
        <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-8 sm:px-10 sm:pb-16 sm:pt-12">
          <Breadcrumb crumb={tool.crumb} />

          {/* One H1, leading with the target keyword. */}
          <h1 className="mt-6 max-w-[16ch] font-display text-[44px] font-bold leading-[0.96] tracking-[-0.04em] text-white sm:text-[68px]">
            Free Online CSS Minifier
          </h1>

          <p className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-muted">
            Strip comments and whitespace, shorten colors, and see exactly how many bytes you
            saved. Data URIs, quoted content, and calc() expressions survive intact. Runs entirely
            in this tab.
          </p>

          <div className="mt-10">
            <CssTool />
          </div>
        </div>
      </section>

      {/* Supporting content: ~540 words of genuinely useful copy. This is what
          separates a page that ranks from a thin tool page that gets filtered. */}
      <article className="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
        <div className="max-w-[72ch] border-t border-line pt-14">
          <h2 className="font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            What minifying actually removes
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            CSS ignores most whitespace, so every indent, line break, and space around a colon is a
            byte you are paying to ship without the browser caring. A minifier deletes exactly those
            bytes and nothing else: comments, redundant whitespace, the final semicolon before a
            closing brace, and the unit on a zero value. The parsed result is identical, which is
            what makes it safe.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            Beyond whitespace there are a few lossless rewrites worth taking.
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              #aabbcc
            </code>
            is the same colour as
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              #abc
            </code>
            , three bytes cheaper.
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              rgb(255, 255, 255)
            </code>
            becomes
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              #fff
            </code>
            . A leading zero in
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              0.5
            </code>
            is optional. Expect 20 to 35% on hand-written CSS, less on anything a build tool has
            already touched.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Four things that break naive minifiers
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            Minifying CSS looks like a job for a few regular expressions, and it is not. Four cases
            defeat that approach, and all four appear in real stylesheets.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">calc() needs its spaces.</strong> The grammar
            requires whitespace around
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">+</code>
            and
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">-</code>
            inside
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              calc()
            </code>
            , so
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              calc(100%-20px)
            </code>
            is not valid CSS and the declaration is dropped entirely. This is the most common way a
            minified layout silently collapses.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">Data URIs contain everything.</strong> A
            base64-encoded SVG inside
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              url()
            </code>
            routinely contains semicolons, commas, and slashes. Treat any of those as CSS
            punctuation and the image is corrupted.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">Strings are opaque.</strong> A
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              content
            </code>
            value can hold braces, semicolons, and even something that looks exactly like a comment.
            None of it may be rewritten.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">Zero is not always unitless.</strong>{" "}
            Dropping the unit from
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              0px
            </code>
            is safe. Dropping it from
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              0s
            </code>
            in a transition is not, because some engines reject a bare zero where a time is
            expected. This tool keeps time units.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Minification versus compression
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            These are different tools solving the same problem at different layers, and you want
            both. Minification is a source transform: it deletes bytes permanently. Compression is a
            transport encoding: gzip or Brotli shrinks the file for transfer and the browser expands
            it on arrival.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            They stack, but not linearly. Gzip is excellent at collapsing repetition, and the
            indentation a minifier strips is highly repetitive, so it was already nearly free over
            the wire. What minification really wins is parse time and the uncompressed size the
            browser holds in memory. A file that is 30% smaller before gzip might only be 8% smaller
            after it, and that is still worth having.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Doing it in your build
          </h2>
          <pre className="mt-5 overflow-x-auto bg-facet-1 p-5 font-mono text-[13.5px] leading-relaxed text-muted">
            <code>{`# Next.js, Vite, and webpack all minify CSS in
# production builds by default — nothing to configure.

# Standalone, via PostCSS
npx postcss styles.css --use cssnano -o styles.min.css

# Lightning CSS, the fastest current option
npx lightningcss --minify styles.css -o styles.min.css`}</code>
          </pre>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            Use this page for the one-off: a snippet from a tutorial, a legacy stylesheet with no
            build step, or simply to see what a file costs before and after. For anything you ship
            on a schedule, put it in the pipeline so it happens without you remembering.
          </p>
        </div>

        <div className="mt-16 max-w-[72ch]">
          <Faq items={tool.faqs} />
        </div>
      </article>

      <RelatedTools
        current={tool.slug}
        slugs={["json-formatter", "markdown-to-html", "hash-generator"]}
      />
    </main>
  );
}
