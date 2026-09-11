import type { Metadata } from "next";
import JsonTool from "@/components/JsonTool";
import Breadcrumb from "@/components/Breadcrumb";
import Faq from "@/components/Faq";
import RelatedTools from "@/components/RelatedTools";
import TriangleField from "@/components/TriangleField";
import { faqJsonLd, getTool, site, toolJsonLd } from "@/lib/site-config";

// Server component. It owns metadata and structured data; the interactive part
// is isolated in <JsonTool />, the page's only client bundle.
const tool = getTool("json-formatter")!;

export const metadata: Metadata = {
  title: tool.h1,
  description: tool.metaDescription,
  keywords: [tool.keyword, "json validator", "json beautifier", "json minifier", "format json online"],
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

export default function JsonPage() {
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
          <h1 className="mt-6 max-w-[19ch] font-display text-[44px] font-bold leading-[0.96] tracking-[-0.04em] text-white sm:text-[68px]">
            Free Online JSON Formatter &amp; Validator
          </h1>

          <p className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-muted">
            Pretty-print, minify, and validate JSON as you type. When something is wrong you get
            the exact line, column, and a plain-language explanation, not a cryptic token error.
            Nothing is uploaded.
          </p>

          <div className="mt-10">
            <JsonTool />
          </div>
        </div>
      </section>

      {/* Supporting content: ~530 words of genuinely useful copy. This is what
          separates a page that ranks from a thin tool page that gets filtered. */}
      <article className="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
        <div className="max-w-[72ch] border-t border-line pt-14">
          <h2 className="font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Why JSON breaks, and how to read the error
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            Almost every invalid JSON document fails for one of four reasons, and all four are
            things that would be perfectly legal in a JavaScript file. That is the trap: JSON looks
            like a JavaScript object literal but is a much stricter subset.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            The most common is a <strong className="font-medium text-white">trailing comma</strong>
            {" "}before a closing brace or bracket. Next is
            <strong className="font-medium text-white"> single quotes</strong>, which JSON does not
            accept anywhere: strings and keys both require double quotes. Third is
            <strong className="font-medium text-white"> unquoted keys</strong>, so
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              {"{ name: 1 }"}
            </code>
            has to become
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              {'{ "name": 1 }'}
            </code>
            . Fourth is <strong className="font-medium text-white">comments</strong>: JSON has no
            comment syntax at all, which surprises people pasting from a tsconfig or a Kubernetes
            manifest.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            The validator above names whichever of these it finds and points a marker at the exact
            character. That is deliberate. Browsers throw wildly different messages for the same
            broken document, and none of them tell you the line number reliably.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Format, minify, or sort
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            Formatting is for reading: indentation and line breaks expose the shape of a deeply
            nested API response at a glance. Minifying is for shipping: stripping optional
            whitespace typically cuts 15-30% off a pretty-printed payload, and over a busy API that
            adds up. The parsed data is byte-identical either way, so it is purely a question of who
            is reading it next, a human or a socket.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            Sorting keys is the underrated option. JSON objects have no defined key order, so two
            responses carrying the same data can serialize their fields differently. Alphabetize
            both and a
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">diff</code>
            suddenly shows only the values that actually changed, which makes this the fastest way
            to compare two API payloads or spot config drift between environments.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Doing it in code
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            The third argument to
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              JSON.stringify
            </code>
            is the one most people forget:
          </p>
          <pre className="mt-5 overflow-x-auto bg-facet-1 p-5 font-mono text-[13.5px] leading-relaxed text-muted">
            <code>{`const pretty = JSON.stringify(data, null, 2);   // indent
const tight  = JSON.stringify(data);            // minify

// Sort keys deeply, for stable diffs
const sorted = JSON.stringify(data, Object.keys(data).sort(), 2);`}</code>
          </pre>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            On the command line,
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              jq . file.json
            </code>
            pretty-prints,
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              jq -c .
            </code>
            minifies, and
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              jq -S .
            </code>
            sorts keys. Python ships the same thing:
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              python -m json.tool
            </code>
            . Use those for large files; use this page when you have a payload on your clipboard and
            want an answer in one paste.
          </p>
          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Three gotchas that survive validation
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">Large integers lose precision.</strong> JSON
            numbers are IEEE-754 doubles, so anything past 2^53 silently rounds. A Twitter-style
            64-bit ID like
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              9007199254740993
            </code>
            comes back one digit different, and the document was perfectly valid the whole time.
            This is why mature APIs send big IDs as strings.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">Duplicate keys are legal.</strong> The spec
            does not forbid
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              {'{ "a": 1, "a": 2 }'}
            </code>
            , and every mainstream parser quietly keeps the last one. If two systems disagree about
            which wins, you get a bug that no validator will ever flag.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">
              There is no date type, and no NaN.
            </strong>{" "}
            Dates are just strings by convention, so use ISO 8601 and be consistent.
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              NaN
            </code>
            and
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              Infinity
            </code>
            are not valid JSON at all:
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              JSON.stringify
            </code>
            turns them into
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              null
            </code>
            without warning you, which is a fun one to debug at 2am.
          </p>
        </div>

        <div className="mt-16 max-w-[72ch]">
          <Faq items={tool.faqs} />
        </div>
      </article>

      <RelatedTools
        current={tool.slug}
        slugs={["yaml-json-converter", "base64-encoder", "jwt-decoder"]}
      />
    </main>
  );
}
