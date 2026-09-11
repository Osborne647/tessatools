import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { site, tools } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who builds Tessacode Tools, why every tool runs client-side, and how the site is funded. Ten free developer utilities with no sign-up and no uploads.",
  alternates: { canonical: "/about/" },
  openGraph: {
    type: "website",
    url: `${site.url}/about/`,
    title: `About ${site.name}`,
    description: "Why every tool here runs in your browser, and who builds them.",
    siteName: site.name,
  },
};

export default function AboutPage() {
  const live = tools.filter((t) => t.status === "live").length;

  return (
    <main>
      <PageHeader
        crumb="About"
        title="Built by one developer, for developers."
        intro={`${live} tools that do one job each, run entirely in your browser, and never ask you to sign up.`}
      />

      <article className="mx-auto max-w-6xl px-6 pb-20 sm:px-10">
        <div className="page-prose max-w-[72ch] border-t border-line pt-12">
          <h2><u>Why this site exists</u></h2>
          <p>
            Search for something like &ldquo;base64 encoder&rdquo; and you land on a page carrying
            four ad slots, a cookie wall, a newsletter modal, and a tool that posts your input to a
            server you know nothing about. You wanted to convert eleven characters. It took nine
            seconds and three dismissals.
          </p>
          <br></br>
          <p>
            Tessacode Tools is the version of that page I wanted to exist. Every tool here does one
            thing, appears already focused, and finishes before you have finished reading the
            heading. There is no account, no dashboard, and no modal.
          </p>
          <br></br>

          <h2><u>Nothing is uploaded. Genuinely.</u></h2>
          <p>
            This is the part worth being precise about, because every tool site claims it and few
            mean it. Every tool on this site is implemented with browser APIs:{" "}
            <code>TextEncoder</code> and <code>btoa</code> for Base64,{" "}
            <code>crypto.subtle</code> for hashing and JWT signature verification,{" "}
            <code>Intl.DateTimeFormat</code> for timezone maths. The parsers for JSON, YAML,
            Markdown, cron, and CSS are hand-written and run in the same tab you are reading this
            in.
          </p>
          <br></br>
          <p>
            There is no backend to send anything to. The whole site is static HTML on a CDN, so
            there is no server-side code that could receive your data even if it wanted to. Open
            your browser&apos;s Network tab, paste a production API token into the JWT decoder, and
            watch nothing happen. That is the entire pitch.
          </p>
          <br></br>
          <p>
            The practical upshot: pasting a secret, an internal config file, or a customer payload
            into these tools is safe in a way that a server-side converter never can be.
          </p>
          <br></br>

          <h2><u>How each tool is built</u></h2>
          <p>
            Every tool&apos;s logic lives in a plain TypeScript module with no framework
            dependencies, which keeps it testable and keeps the shipped bundle small. A few choices
            worth calling out, because they are where the tools differ from the alternatives:
          </p>
          <br></br>
          <ul>
            <li>
              <strong>The JSON validator reports line and column.</strong> Browsers throw wildly
              different messages for the same broken document and none reliably give a position, so
              the parser is hand-written to point at the exact character and name the cause.
            </li>
            <br></br>
            <li>
              <strong>The cron parser implements the OR rule correctly.</strong> When both
              day-of-month and day-of-week are restricted, cron fires if either matches. Most
              parsers get this backwards.
            </li>
            <br></br>
            <li>
              <strong>The Markdown converter escapes by default.</strong> Raw HTML in the source
              renders as visible text rather than live markup, so output you paste elsewhere can
              never carry a payload.
            </li>
            <br></br>
            <li>
              <strong>The YAML converter follows the 1.2 core schema.</strong> So{" "}
              <code>no</code> stays the string <code>&quot;no&quot;</code> instead of turning into{" "}
              <code>false</code> — the Norway problem.
            </li>
            <br></br>
            <li>
              <strong>The CSS minifier walks characters, not regexes.</strong> Which is why data
              URIs, quoted content strings, and <code>calc()</code> spacing survive intact.
            </li>
          </ul>
          <br></br>

          <h2><u>Who builds it</u></h2>
          <p>
            Tessacode Tools is made by <strong>Tessacode Solutions</strong>, a one-person studio
            building small, fast web software. The tools are a side project that exists because I
            kept needing them and kept disliking the options.
          </p>
          <br></br>
          <p>
            If something is wrong, slow, or missing, I would genuinely like to know. The fastest
            way to improve a tool is someone telling me the case it fails on.{" "}
            <Link href="/contact">Get in touch</Link>.
          </p>
          <br></br>

          <h2><u>How the site pays for itself</u></h2>
          <p>
            Hosting is free and the domain costs about fifteen dollars a year, so the bar is low.
            The plan is display advertising, kept to placements that do not cover the tool or shift
            the page while it loads. If the ads ever make a tool worse to use, they are the thing
            that goes.
          </p>
          <br></br>
          <p>
            No tool will be moved behind a paywall. If a paid tier ever appears it will be for
            genuinely additional things such as API access or bulk processing, and everything
            available today will stay free. What you see now is the free tier, permanently.
          </p>
          <br></br>
          <p>
            The ads and the analytics are also the only reason this site touches your data at all,
            which the <Link href="/privacy">privacy policy</Link> covers in specific detail.
          </p>
        </div>

        <div className="mt-14 max-w-[72ch]">
          <Link
            href="/"
            className="inline-block bg-facet-3 px-6 py-4 font-mono text-[13px] text-teal transition-colors hover:bg-facet-hover"
          >
            Browse all {live} tools →
          </Link>
        </div>
      </article>
    </main>
  );
}
