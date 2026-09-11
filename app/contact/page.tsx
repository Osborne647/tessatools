import type { Metadata } from "next";
import Link from "next/link";
import ContactComposer from "@/components/ContactComposer";
import PageHeader from "@/components/PageHeader";
import { site } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Report a bug, request a tool, or ask a question about Tessacode Tools. One developer reads every message.",
  alternates: { canonical: "/contact/" },
  openGraph: {
    type: "website",
    url: `${site.url}/contact/`,
    title: `Contact — ${site.name}`,
    description: "Report a bug, request a tool, or ask a question.",
    siteName: site.name,
  },
};

export default function ContactPage() {
  return (
    <main>
      <PageHeader
        crumb="contact"
        title="Tell me what is broken."
        intro="One person builds and reads everything here, so a message about a tool that fails on your input is the single most useful thing you can send."
      />

      <div className="mx-auto max-w-6xl px-6 pb-6 sm:px-10">
        <div className="max-w-[60ch] border-t border-line pt-12">
          <ContactComposer />
        </div>
      </div>

      <article className="mx-auto max-w-6xl px-6 pb-20 sm:px-10">
        <div className="page-prose max-w-[72ch] pt-8">
          <h2><u>What gets a fast reply</u></h2>
          <ul>
            <li>
              <strong>A tool that produces the wrong output.</strong> Include the exact input if you
              can share it. Most parser bugs are one specific character in one specific position,
              and a real example finds it in minutes rather than hours.
            </li>
            <br></br>
            <li>
              <strong>A tool that fails on a valid input.</strong> Especially for the YAML, cron, and
              CSS tools, where the specifications are large and this implementation covers the
              practical subset rather than every corner.
            </li>
            <br></br>
            <li>
              <strong>A tool you keep searching for.</strong> The build list is driven by what
              people actually need, and a single clear request is usually enough to put something on
              it.
            </li>
            <br></br>
            <li>
              <strong>Anything privacy-related.</strong> If you spot something that contradicts the{" "}
              <Link href="/privacy">privacy policy</Link>, that goes to the top of the list.
            </li>
          </ul>
          <br></br>

          <h2><u>What I cannot help with</u></h2>
          <p>
            I cannot debug your application, recover a file you converted, or tell you what a token
            you decoded means. The tools keep no history, so once a tab is closed the data is gone
            from everywhere, including from me.
          </p>
          <br></br>
          <p>
            Please also do not email me live credentials for diagnosis. If a token fails to decode,
            describing its shape is enough: the algorithm in the header, the approximate length, and
            what error appeared.
          </p>
          <br></br>

          <h2><u>Other ways to reach me</u></h2>
          <p>
            Email is best:{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </p>
          <br></br>
          <p>
            There is no form that posts to a server here, and that is deliberate. The whole site is
            static with no backend, which is what lets the tools promise that nothing is uploaded.
            Adding a form endpoint just for this page would undercut the claim, so the composer above
            hands off to your own mail client instead.
          </p>
          <br></br>

          <h2><u>Response time</u></h2>
          <p>
            This is a side project, so allow a few days. Bug reports with a reproducible input get
            looked at first, because they are the ones I can actually act on.
          </p>
        </div>

        <div className="mt-12 max-w-[72ch]">
          <Link
            href="/"
            className="inline-block bg-facet-3 px-6 py-4 font-mono text-[13px] text-teal transition-colors hover:bg-facet-hover"
          >
            Back to the Tools →
          </Link>
        </div>
      </article>
    </main>
  );
}
