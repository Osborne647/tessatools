import type { Metadata } from "next";
import Base64Tool from "@/components/Base64Tool";
import Breadcrumb from "@/components/Breadcrumb";
import Faq from "@/components/Faq";
import RelatedTools from "@/components/RelatedTools";
import TriangleField from "@/components/TriangleField";
import { faqJsonLd, getTool, site, toolJsonLd } from "@/lib/site-config";

const tool = getTool("base64-encoder")!;

export const metadata: Metadata = {
  title: tool.h1,
  description: tool.metaDescription,
  keywords: [
    tool.keyword,
    "base64 decoder",
    "base64 to text",
    "encode base64 online",
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
    {
      "@type": "ListItem",
      position: 2,
      name: tool.name,
      item: `${site.url}/tools/${tool.slug}/`,
    },
  ],
};

export default function Base64Page() {
  return (
    <main>
      {[toolJsonLd(tool), faqJsonLd(tool.faqs), breadcrumbJsonLd].map(
        (schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ),
      )}

      <section className="relative">
        <TriangleField />
        <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-8 sm:px-10 sm:pb-16 sm:pt-12">
          <Breadcrumb crumb={tool.crumb} />

          <h1 className="mt-6 max-w-[18ch] font-display text-[44px] font-bold leading-[0.96] tracking-[-0.04em] text-white sm:text-[68px]">
            Free Online Base64 Encoder &amp; Decoder
          </h1>

          <p className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-muted">
            Convert text to Base64 and back in real time. Handles UTF-8, emoji,
            files, and the URL-safe variant. Everything runs in this tab, so
            your data is never uploaded.
          </p>

          <div className="mt-10">
            <Base64Tool />
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
        <div className="max-w-[72ch] border-t border-line pt-14">
          <h2 className="font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            What is Base64 encoding?
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            Base64 is a way of representing binary data using only 64 printable
            ASCII characters:
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              A–Z a–z 0–9 + /
            </code>
            plus
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              =
            </code>
            for padding. It takes three bytes of input at a time, splits those
            24 bits into four six-bit groups, and maps each group to one
            character. That is why Base64 output is always about 33% larger than
            the input: you are spending four characters to carry three bytes.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            It is worth being clear about what Base64 is not. It is not
            encryption and it is not compression. Anyone can decode it
            instantly, which is exactly what the decoder above does. Base64 is a
            transport format: it lets binary data survive a trip through systems
            that only expect text.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            When you actually need it
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            The most common case is HTTP Basic Authentication, where
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              username:password
            </code>
            is Base64-encoded into the Authorization header. Because that
            encoding is trivially reversible, Basic Auth is only safe over
            HTTPS. You will also hit Base64 in data URIs that inline a small
            image directly in CSS or HTML, in email attachments via MIME, in the
            header and payload segments of a JWT, and in Kubernetes Secrets,
            where values are stored Base64-encoded and are routinely mistaken
            for encrypted ones.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            How to use this tool
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            Paste or type into the left panel and the result appears on the
            right as you type. Hit{" "}
            <strong className="font-medium text-white">decode</strong> to go the
            other direction, or use the swap button between the panels to feed
            the output straight back in as new input, which is the fastest way
            to sanity-check a round trip. Drop a file anywhere on the input
            panel to encode its raw bytes. Toggle{" "}
            <strong className="font-medium text-white">url-safe</strong> when
            the result has to live in a URL or filename: it swaps
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              +
            </code>
            for
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              -
            </code>
            ,
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              /
            </code>
            for
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              _
            </code>
            , and drops the trailing padding.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Doing it in code
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            In the browser,
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              btoa()
            </code>
            and
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              atob()
            </code>
            only handle Latin-1, so any character above U+00FF throws. Convert
            to UTF-8 bytes first:
          </p>
          <pre className="mt-5 overflow-x-auto bg-facet-1 p-5 font-mono text-[13.5px] leading-relaxed text-muted">
            <code>{`const bytes = new TextEncoder().encode("café · 🚀");
const b64 = btoa(String.fromCharCode(...bytes));

const back = new TextDecoder().decode(
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
);`}</code>
          </pre>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            In Node, skip all of that and use
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              Buffer.from(str).toString(&quot;base64&quot;)
            </code>
            , which is UTF-8 aware by default and supports
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              &quot;base64url&quot;
            </code>{" "}
            for the URL-safe variant. Python users want
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              base64.b64encode(s.encode())
            </code>
            .
          </p>
          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Three mistakes worth avoiding
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            The first is treating Base64 as a security measure. Encoding a
            password, an API key, or a config value hides nothing: it is a
            public, reversible mapping, and a Kubernetes Secret is protected by
            cluster access control, not by the encoding. If a value needs to
            stay private, encrypt it.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            The second is inlining large assets as data URIs. Base64 adds
            roughly a third to the payload, and an inlined image cannot be
            cached separately from the document that carries it, so the browser
            re-downloads it on every page load. Inline tiny icons if you must;
            serve anything bigger as its own cacheable file.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            The third is mixing up the standard and URL-safe alphabets. If a
            token arrives with
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              -
            </code>
            or
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              _
            </code>
            in it, a strict standard decoder will reject it outright. The
            decoder above accepts both alphabets and restores missing padding,
            which is usually why a token that failed elsewhere decodes fine
            here.
          </p>
        </div>

        <div className="mt-16 max-w-[72ch]">
          <Faq items={tool.faqs} />
        </div>
      </article>

      <RelatedTools
        current={tool.slug}
        slugs={["jwt-decoder", "hash-generator", "json-formatter"]}
      />
    </main>
  );
}
