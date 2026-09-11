import type { Metadata } from "next";
import CronTool from "@/components/CronTool";
import Breadcrumb from "@/components/Breadcrumb";
import Faq from "@/components/Faq";
import RelatedTools from "@/components/RelatedTools";
import TriangleField from "@/components/TriangleField";
import { faqJsonLd, getTool, site, toolJsonLd } from "@/lib/site-config";

// Server component. It owns metadata and structured data; the interactive part
// is isolated in <CronTool />, the page's only client bundle.
const tool = getTool("cron-parser")!;

export const metadata: Metadata = {
  title: tool.h1,
  description: tool.metaDescription,
  keywords: [
    tool.keyword,
    "cron expression generator",
    "crontab parser",
    "cron schedule explained",
    "what does this cron do",
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

export default function CronPage() {
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
            Free Cron Expression Parser
          </h1>

          <p className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-muted">
            Paste a cron expression and get it back in plain English, plus the next five times it
            will actually run in your timezone. Handles ranges, steps, name aliases, and the
            day-of-week rule most parsers get wrong.
          </p>

          <div className="mt-10">
            <CronTool />
          </div>
        </div>
      </section>

      {/* Supporting content: ~540 words of genuinely useful copy. This is what
          separates a page that ranks from a thin tool page that gets filtered. */}
      <article className="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
        <div className="max-w-[72ch] border-t border-line pt-14">
          <h2 className="font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            How to read the five fields
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            A cron expression is five space-separated fields, always in the same order: minute,
            hour, day of month, month, day of week. Each field takes one of five forms.
          </p>
          <pre className="mt-5 overflow-x-auto bg-facet-1 p-5 font-mono text-[13.5px] leading-relaxed text-muted">
            <code>{`┌───────── minute        0-59
│ ┌─────── hour          0-23
│ │ ┌───── day of month  1-31
│ │ │ ┌─── month         1-12  (or jan-dec)
│ │ │ │ ┌─ day of week   0-6   (0 = Sunday, or sun-sat)
│ │ │ │ │
* * * * *

*        every value
5        exactly 5
1,3,5    a list
9-17     a range
*/15     a step, so every 15th value`}</code>
          </pre>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            Steps combine with ranges, so
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              0-30/10
            </code>
            means minutes 0, 10, 20, and 30. Most crons also accept three-letter names for months
            and days, and the shorthands
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              @daily
            </code>
            ,
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              @hourly
            </code>
            , and
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              @weekly
            </code>
            .
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            The day-of-week trap
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            This is the single most misunderstood rule in cron, and it has broken production
            schedules at every company that has ever used a crontab. When
            <strong className="font-medium text-white"> both</strong> the day-of-month and
            day-of-week fields are restricted, cron runs the job if
            <strong className="font-medium text-white"> either</strong> field matches. Not both.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            So
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              0 0 15 * 3
            </code>
            does not mean &ldquo;midnight on the 15th, but only if it is a Wednesday&rdquo;. It
            means &ldquo;midnight on the 15th, and also every Wednesday&rdquo;, which fires about
            five times a month instead of once or twice a year. Try that expression in the tool
            above and watch the run times.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            When only one of the two fields is restricted, the behaviour is what you would expect:
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              0 9 * * 1-5
            </code>
            runs at 9am on weekdays only. The OR rule kicks in solely when both are set, so the
            practical advice is simple: never restrict both fields in the same expression unless you
            genuinely want the union.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Daylight saving will bite you
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            Cron schedules wall-clock time, and wall-clock time is not continuous. When a zone
            springs forward, an hour of local time never happens, so a job scheduled at 2:30am is
            skipped on that date. When it falls back, that hour happens twice, and depending on the
            daemon the job may run twice.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            Implementations disagree about the right fix, which means portable code cannot rely on
            any of them. Two habits avoid the whole category: run the cron daemon in UTC, or keep
            schedules out of the 1am-to-3am window entirely. If a job absolutely must run exactly
            once per day, make it idempotent and have it check whether today&apos;s work is already
            done.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Standard cron versus Quartz
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            Copy an expression off Stack Overflow and it may not be the dialect you need. Standard
            Unix cron takes five fields. Quartz, used by Java schedulers, takes six or seven, adding
            a leading seconds field and an optional trailing year. Quartz also supports
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">L</code>
            for the last day of the month,
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">W</code>
            for the nearest weekday, and
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">#</code>
            for the nth weekday of the month. None of those work in a normal crontab.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            This parser targets standard five-field cron, and when it sees a Quartz-only token it
            says so rather than just calling the expression invalid.
          </p>
        </div>

        <div className="mt-16 max-w-[72ch]">
          <Faq items={tool.faqs} />
        </div>
      </article>

      <RelatedTools
        current={tool.slug}
        slugs={["timestamp-converter", "uuid-generator", "json-formatter"]}
      />
    </main>
  );
}
