import type { Metadata } from "next";
import YamlTool from "@/components/YamlTool";
import Breadcrumb from "@/components/Breadcrumb";
import Faq from "@/components/Faq";
import RelatedTools from "@/components/RelatedTools";
import TriangleField from "@/components/TriangleField";
import { faqJsonLd, getTool, site, toolJsonLd } from "@/lib/site-config";

const tool = getTool("yaml-json-converter")!;

export const metadata: Metadata = {
  title: tool.h1,
  description: tool.metaDescription,
  keywords: [
    tool.keyword,
    "json to yaml",
    "yaml converter",
    "yaml parser online",
    "yaml validator",
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

export default function YamlPage() {
  return (
    <main>
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
          <h1 className="mt-6 max-w-[19ch] font-display text-[44px] font-bold leading-[0.96] tracking-[-0.04em] text-white sm:text-[68px]">
            Free YAML to JSON Converter
          </h1>

          <p className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-muted">
            Convert YAML to JSON or JSON to YAML as you type. Anchors, merge keys, block scalars,
            and multi-document streams all survive the trip, and ambiguous strings get quoted
            automatically. Nothing is uploaded.
          </p>

          <div className="mt-10">
            <YamlTool />
          </div>
        </div>
      </section>
      <article className="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
        <div className="max-w-[72ch] border-t border-line pt-14">
          <h2 className="font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Two formats, one data model
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            YAML is a superset of JSON. Any valid JSON document is already valid YAML, which is why
            conversion in that direction is lossless and boring. Going the other way is where the
            interesting parts live, because YAML has several features JSON simply does not:
            comments, anchors and aliases for reuse, block scalars for multi-line text, and multiple
            documents in one file separated by
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              ---
            </code>
            .
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            None of those survive a round trip. Comments are discarded, because JSON has nowhere to
            put them. Aliases are expanded inline, since JSON has no reference syntax. A
            multi-document stream becomes a JSON array. The data is always preserved exactly; the
            authoring conveniences are not.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            The Norway problem
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            This is the most famous bug in YAML, and it is worth understanding before it costs you
            an afternoon. Under YAML 1.1, these all resolve to booleans when unquoted:
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              y
            </code>
            ,
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">n</code>
            ,
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">yes</code>
            ,
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">no</code>
            ,
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">on</code>
            , and
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">off</code>
            . So a list of country codes containing Norway&apos;s
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              NO
            </code>
            silently becomes
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              false
            </code>
            .
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            YAML 1.2 fixed this: only
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">true</code>
            and
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">false</code>
            are booleans in the core schema. This converter follows 1.2, so
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">no</code>
            stays a string. But plenty of tooling still runs on 1.1 parsers, so the safe habit is to
            quote any string that could be mistaken for something else. When emitting YAML, this
            tool quotes those values for you.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Other ways YAML changes your data
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">Version numbers lose a digit.</strong>{" "}
            Unquoted
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              1.20
            </code>
            is a float, and floats do not keep insignificant zeros, so it reads back as
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">1.2</code>
            . The same trap catches ZIP codes with leading zeros and anything that looks like
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              1:30
            </code>
            , which older parsers read as a sexagesimal number.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">Tabs are illegal.</strong> YAML forbids tab
            characters for indentation outright. An editor configured for tabs will produce files
            that fail to parse with a message that rarely points at the real cause.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">
              Block scalars are not interchangeable.
            </strong>{" "}
            The literal style
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">|</code>
            keeps every newline, which is what a shell script needs. The folded style
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">&gt;</code>
            joins lines into paragraphs, which suits prose. Adding
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">-</code>
            strips the trailing newline and
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">+</code>
            keeps all of them.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Doing it in code
          </h2>
          <pre className="mt-5 overflow-x-auto bg-facet-1 p-5 font-mono text-[13.5px] leading-relaxed text-muted">
            <code>{`# Shell — yq speaks both directions
yq -o json '.' config.yaml
yq -P '.' config.json

# Python
import yaml, json
json.dumps(yaml.safe_load(open("config.yaml")))

# JavaScript
import { parse, stringify } from "yaml";`}</code>
          </pre>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            In Python, always use
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              yaml.safe_load
            </code>
            rather than
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              yaml.load
            </code>
            . The unsafe version can instantiate arbitrary Python objects from a crafted document,
            which makes parsing an untrusted config file a remote code execution risk.
          </p>
        </div>

        <div className="mt-16 max-w-[72ch]">
          <Faq items={tool.faqs} />
        </div>
      </article>

      <RelatedTools
        current={tool.slug}
        slugs={["json-formatter", "markdown-to-html", "base64-encoder"]}
      />
    </main>
  );
}
