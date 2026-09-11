import type { Metadata } from "next";
import MarkdownTool from "@/components/MarkdownTool";
import Breadcrumb from "@/components/Breadcrumb";
import Faq from "@/components/Faq";
import RelatedTools from "@/components/RelatedTools";
import TriangleField from "@/components/TriangleField";
import { faqJsonLd, getTool, site, toolJsonLd } from "@/lib/site-config";

// Server component. It owns metadata and structured data; the interactive part
// is isolated in <MarkdownTool />, the page's only client bundle.
const tool = getTool("markdown-to-html")!;

export const metadata: Metadata = {
  title: tool.h1,
  description: tool.metaDescription,
  keywords: [
    tool.keyword,
    "markdown converter",
    "md to html",
    "markdown preview",
    "gfm to html",
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

export default function MarkdownPage() {
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
            Free Markdown to HTML Converter
          </h1>

          <p className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-muted">
            Write or paste Markdown and get clean, escaped HTML back instantly, with a live
            preview. Supports GitHub-flavored tables, fenced code, and task lists. Nothing is
            uploaded.
          </p>

          <div className="mt-10">
            <MarkdownTool />
          </div>
        </div>
      </section>

      {/* Supporting content: ~540 words of genuinely useful copy. This is what
          separates a page that ranks from a thin tool page that gets filtered. */}
      <article className="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
        <div className="max-w-[72ch] border-t border-line pt-14">
          <h2 className="font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Markdown, and which flavor you are writing
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            Markdown is a plain-text syntax that converts cleanly to HTML, designed so the source
            stays readable even before it is rendered. The catch is that there is no single
            Markdown. John Gruber&apos;s 2004 original left enough ambiguity that implementations
            diverged, which is why the same document can render three different ways in three
            different tools.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            Two dialects matter in practice. CommonMark is the strict specification that settled the
            ambiguities. GitHub-Flavored Markdown builds on it and adds the features people
            actually reach for: tables, strikethrough, task lists, and automatic linking of bare
            URLs. This converter targets GFM, because that is what a README, a pull request
            description, and most documentation sites expect.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            The syntax worth memorizing
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            Most of Markdown is obvious after one look. These are the parts that are not:
          </p>
          <pre className="mt-5 overflow-x-auto bg-facet-1 p-5 font-mono text-[13.5px] leading-relaxed text-muted">
            <code>{`| Tool   | KD | Time |
|:-------|:--:|-----:|   <- colons set column alignment
| Base64 | 18 | 3h   |

- [x] a completed task
- [ ] an open one
  - [ ] indent two spaces to nest

Trailing two spaces force a line break.  
This line is part of the same paragraph.

\`\`\`js
// language after the fence enables highlighting
\`\`\``}</code>
          </pre>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            The alignment colons in a table&apos;s delimiter row are the detail people look up most
            often. A colon on the left aligns left, on the right aligns right, on both centers the
            column.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Why the HTML output is escaped
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            Most converters pass raw HTML in the source straight through to the output. That is
            convenient and it is also how a Markdown document becomes a cross-site scripting
            vector: a
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              &lt;script&gt;
            </code>
            tag, an
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              onerror
            </code>
            attribute, or a
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              javascript:
            </code>
            link in a user-submitted comment executes on whatever page renders it.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            This converter escapes every text node during conversion and can only emit a fixed
            allowlist of tags, so dangerous markup in the source arrives in the output as visible
            text. The trade-off is real and deliberate: you cannot drop a raw
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              &lt;div&gt;
            </code>
            into your Markdown and have it render. In exchange, output you paste into a page can
            never carry a payload.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Doing it in code
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            In JavaScript, the two standard choices are
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              marked
            </code>
            for a single fast call and the
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              remark
            </code>
            ecosystem when you need to transform the document tree. In React, reach for
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              react-markdown
            </code>
            with
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              remark-gfm
            </code>
            , which renders to real components and skips the
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              dangerouslySetInnerHTML
            </code>
            problem entirely. Whatever you pick, if the Markdown comes from a user, run the output
            through a sanitizer such as DOMPurify before it reaches the DOM. A converter and a
            sanitizer are different jobs, and most converters do not do the second one.
          </p>
          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Where Markdown quietly bites
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">Underscores inside words.</strong> A variable
            named
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              user_id_value
            </code>
            can turn half your sentence italic, because the underscores read as emphasis markers.
            Wrap identifiers in backticks and the problem disappears.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">Lists that refuse to nest.</strong> Nesting
            depends on indentation, and different parsers disagree about how much is enough. Two
            spaces per level is the safest choice; tabs and four-space indents are where a nested
            list silently flattens or becomes a code block instead.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">Missing blank lines.</strong> Markdown uses
            blank lines to separate blocks. A table, list, or heading pressed directly against the
            paragraph above it often gets absorbed into that paragraph. If something is not
            rendering, an absent blank line is the first thing to check.
          </p>
        </div>

        <div className="mt-16 max-w-[72ch]">
          <Faq items={tool.faqs} />
        </div>
      </article>

      <RelatedTools
        current={tool.slug}
        slugs={["json-formatter", "yaml-json-converter", "base64-encoder"]}
      />
    </main>
  );
}
