import type { Metadata } from "next";
import TimestampTool from "@/components/TimestampTool";
import Breadcrumb from "@/components/Breadcrumb";
import Faq from "@/components/Faq";
import RelatedTools from "@/components/RelatedTools";
import TriangleField from "@/components/TriangleField";
import { faqJsonLd, getTool, site, toolJsonLd } from "@/lib/site-config";

const tool = getTool("timestamp-converter")!;

export const metadata: Metadata = {
  title: tool.h1,
  description: tool.metaDescription,
  keywords: [
    tool.keyword,
    "epoch converter",
    "unix time",
    "timestamp to date",
    "date to timestamp",
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

export default function TimestampPage() {
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
          <h1 className="mt-6 max-w-[17ch] font-display text-[44px] font-bold leading-[0.96] tracking-[-0.04em] text-white sm:text-[68px]">
            Free Unix Timestamp Converter
          </h1>

          <p className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-muted">
            Paste a timestamp in seconds, milliseconds, microseconds, or nanoseconds and get every
            format back in any timezone. Convert dates to epoch values too, with real daylight
            saving handling.
          </p>

          <div className="mt-10">
            <TimestampTool />
          </div>
        </div>
      </section>
      <article className="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
        <div className="max-w-[72ch] border-t border-line pt-14">
          <h2 className="font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            What a Unix timestamp actually is
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            A Unix timestamp counts the seconds since midnight UTC on 1 January 1970. That is the
            whole idea. It is one integer, always in UTC, with no notion of timezone, locale, or
            formatting baked in, which is exactly why it is the format databases and APIs reach for.
            Two servers on opposite sides of the planet handed the same timestamp agree on the
            instant it names, even though they would render it as different wall-clock times.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            One wrinkle worth knowing: Unix time deliberately ignores leap seconds. A day is always
            exactly 86,400 seconds, so the count drifts very slightly from astronomical time. For
            anything short of satellite navigation, that is a feature rather than a bug, because the
            arithmetic stays simple.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Seconds, milliseconds, or something worse
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            The single most common timestamp bug is a unit mismatch, and it is easy to spot once you
            know the trick: count the digits. Ten digits is seconds, the classic Unix value. Thirteen
            is milliseconds, which is what JavaScript&apos;s
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              Date.now()
            </code>
            returns. Sixteen is microseconds, typical of Postgres and Python&apos;s
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              time.time_ns()
            </code>
            divided down. Nineteen is nanoseconds, which Go and Prometheus favour.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            Feed a seconds value into a function expecting milliseconds and you land in January 1970.
            Feed milliseconds where seconds are expected and you end up somewhere around the year
            57,000. Both are obviously wrong on sight, which is the good news. The converter above
            detects the unit from the length so you never have to choose.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Timezones are a rendering concern
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            A timestamp has no timezone. It never did. The timezone only enters when you turn that
            integer into something a person reads, which is why storing a UTC timestamp and
            formatting at display time is the only approach that does not eventually corrupt data.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            The direction that actually hurts is the reverse: converting a local wall-clock time
            back into an epoch value. Daylight saving makes that mapping neither total nor unique.
            On the spring-forward date an hour of local time does not exist at all, so 2:30am in US
            Central on 8 March 2026 names no instant. On the autumn fall-back date a different hour
            happens twice, so 1:30am on 1 November 2026 names two. This converter flags the first
            case instead of silently returning a value an hour off, which is what most naive
            implementations do.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Doing it in code
          </h2>
          <pre className="mt-5 overflow-x-auto bg-facet-1 p-5 font-mono text-[13.5px] leading-relaxed text-muted">
            <code>{`// JavaScript — note that Date works in MILLISECONDS
const seconds = Math.floor(Date.now() / 1000);
const date = new Date(seconds * 1000);

// Python
import time, datetime
time.time()                                  // float seconds
datetime.datetime.fromtimestamp(1757601720)

// SQL
SELECT to_timestamp(1757601720);             -- Postgres
SELECT FROM_UNIXTIME(1757601720);            -- MySQL

// Shell
date -r 1757601720                           // macOS
date -d @1757601720                          // Linux`}</code>
          </pre>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            If you are formatting in the browser, skip the date libraries.
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              Intl.DateTimeFormat
            </code>
            ships the full IANA timezone database and handles DST correctly. This entire tool is
            built on it, with no dependencies.
          </p>
        </div>

        <div className="mt-16 max-w-[72ch]">
          <Faq items={tool.faqs} />
        </div>
      </article>

      <RelatedTools
        current={tool.slug}
        slugs={["cron-parser", "jwt-decoder", "uuid-generator"]}
      />
    </main>
  );
}
