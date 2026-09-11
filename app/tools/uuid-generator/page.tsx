import type { Metadata } from "next";
import UuidTool from "@/components/UuidTool";
import Breadcrumb from "@/components/Breadcrumb";
import Faq from "@/components/Faq";
import RelatedTools from "@/components/RelatedTools";
import TriangleField from "@/components/TriangleField";
import { faqJsonLd, getTool, site, toolJsonLd } from "@/lib/site-config";

// Server component. It owns metadata and structured data; the interactive part
// is isolated in <UuidTool />, the page's only client bundle.
const tool = getTool("uuid-generator")!;

export const metadata: Metadata = {
  title: tool.h1,
  description: tool.metaDescription,
  keywords: [tool.keyword, "uuid v4 generator", "uuid v7", "guid generator", "random uuid"],
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

export default function UuidPage() {
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
          <h1 className="mt-6 max-w-[18ch] font-display text-[44px] font-bold leading-[0.96] tracking-[-0.04em] text-white sm:text-[68px]">
            Free Online UUID Generator
          </h1>

          <p className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-muted">
            Generate random v4 or time-ordered v7 UUIDs, one at a time or a thousand at once, in
            whatever shape your code needs. Everything is generated in this tab with the browser&apos;s
            secure random source.
          </p>

          <div className="mt-10">
            <UuidTool />
          </div>
        </div>
      </section>

      {/* Supporting content: ~520 words of genuinely useful copy. This is what
          separates a page that ranks from a thin tool page that gets filtered. */}
      <article className="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
        <div className="max-w-[72ch] border-t border-line pt-14">
          <h2 className="font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            What is a UUID?
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            A UUID is a 128-bit identifier written as 32 hexadecimal characters in a
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              8-4-4-4-12
            </code>
            pattern. The point of the format is that any machine can mint one without asking a
            central authority and still be confident nobody else will produce the same value. That
            is why UUIDs show up wherever an auto-incrementing integer would be awkward: distributed
            systems, offline-first clients, and anywhere a client needs an ID before it talks to the
            server.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            Two of the characters are not random. The first digit of the third group is the version,
            and the first digit of the fourth group encodes the variant. That is how the validator
            above can tell you what kind of UUID you pasted without any lookup.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            v4 vs v7: which one you want
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">Version 4</strong> is 122 random bits and
            nothing else. It reveals no information about when or where it was created, which makes
            it the right pick for public-facing tokens, share links, and anything a user might see.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">Version 7</strong> puts a Unix millisecond
            timestamp in the leading 48 bits and randomness in the rest, so the values sort
            chronologically as plain strings. This matters more than it sounds: random v4 keys
            scatter inserts across a B-tree index, fragmenting pages and pushing write amplification
            up as the table grows. Sequential v7 keys append to the end of the index instead, which
            is why Postgres and MySQL shops have been switching to it. The tradeoff is that anyone
            holding the ID can read its creation time.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            The simple rule: v7 for database primary keys, v4 for anything exposed publicly.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Generating them in code
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            Modern browsers and Node both ship a native v4 generator, so you rarely need a library
            for it:
          </p>
          <pre className="mt-5 overflow-x-auto bg-facet-1 p-5 font-mono text-[13.5px] leading-relaxed text-muted">
            <code>{`// Browser and Node 19+
const id = crypto.randomUUID();

// Node, any version
import { randomUUID } from "node:crypto";

// Python
import uuid; str(uuid.uuid4())`}</code>
          </pre>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            There is no native v7 yet, so reach for the
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">uuid</code>
            package (<code className="bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">v7()</code>
            {" "}since v10) in JavaScript, or
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              uuid_generate_v7()
            </code>
            in Postgres 18. Whatever you use, make sure it is backed by a cryptographic random
            source. A generator built on
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              Math.random()
            </code>
            produces values that look fine and are both predictable and collision-prone.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Should you worry about collisions?
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            No. To reach even a one-in-a-billion chance of a single duplicate v4, you would need to
            generate roughly 2.7 quintillion of them. Every UUID in the batch above is unique, and
            the v7 generator adds a monotonic counter so that values created inside the same
            millisecond stay both distinct and correctly ordered. The realistic failure mode is not
            a collision: it is a weak random source.
          </p>
        </div>

        <div className="mt-16 max-w-[72ch]">
          <Faq items={tool.faqs} />
        </div>
      </article>

      <RelatedTools
        current={tool.slug}
        slugs={["base64-encoder", "hash-generator", "timestamp-converter"]}
      />
    </main>
  );
}
