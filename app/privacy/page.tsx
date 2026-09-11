import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { site } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Tessacode Tools does and does not collect. Tool input is processed entirely in your browser and never transmitted. Full detail on analytics and advertising cookies.",
  alternates: { canonical: "/privacy/" },
  openGraph: {
    type: "website",
    url: `${site.url}/privacy/`,
    title: `Privacy Policy — ${site.name}`,
    description: "Tool input never leaves your browser. Here is everything else, in detail.",
    siteName: site.name,
  },
};

export default function PrivacyPage() {
  return (
    <main>
      <PageHeader
        crumb="Privacy"
        title="Privacy Policy"
        intro="The short version: anything you type or drop into a tool stays in your browser and is never transmitted. Analytics and ads are a separate matter, and this page covers them in full."
      />

      <article className="mx-auto max-w-6xl px-6 pb-20 sm:px-10">
        <div className="page-prose max-w-[72ch] border-t border-line pt-12">
          <p className="font-mono text-[12px] text-sub">
            Last updated {site.policyUpdated}
          </p>

          <h2><u>What this policy covers</u></h2>
          <p>
            This policy applies to <strong>{site.url}</strong> and every tool hosted on it. It is
            written to be read rather than to be defensible, so where something is uncertain it says
            so plainly.
          </p>
          <br></br>

          <h2><u>Your tool input is never collected</u></h2>
          <p>
            This is the most important section, so it comes first. Every tool on this site runs
            entirely inside your browser using standard web platform APIs. Text you type, files you
            drop, tokens you paste, and configuration you convert are processed locally and
            discarded when you close or reload the tab.
          </p>
          <br></br>
          <p>
            That data is <strong>never transmitted, logged, stored, or seen by anyone</strong>,
            including me. This is not a policy promise that could quietly change: the site is
            static files served from a CDN with no backend, so there is no server-side code capable
            of receiving it. You can verify this yourself by opening your browser&apos;s developer
            tools, switching to the Network tab, and using any tool on the site. No request is
            made.
          </p>
          <br></br>
          <p>
            Concretely, none of the following ever leaves your device: text or files you hash,
            JSON, YAML, Markdown, or CSS you convert, JWTs you decode, HMAC secrets you enter, or
            UUIDs you generate.
          </p>
          <br></br>

          <h2><u>What is collected</u></h2>
          <p>
            Two third-party services do collect data about your visit, in the ordinary way that
            almost all websites do. Both are described below.
          </p>
          <br></br>

          <h3><u>Analytics</u></h3>
          <p>
            The site uses Google Analytics 4 to understand which tools people use and which pages
            perform badly. It records things like pages viewed, approximate location derived from
            IP address (typically to city level), device and browser type, referring site, and
            session duration. IP addresses are anonymised by Google before storage and are not
            available to me.
          </p>
          <br></br>
          <p>
            I use this only in aggregate, to decide which tool to build next and which page is too
            slow. I cannot identify you from it, and I do not try to.
          </p>
          <br></br>

          <h3><u>Advertising</u></h3>
          <p>
            The site displays ads through Google AdSense. Google and its partners use cookies and
            similar technologies to serve ads, and may use your prior visits to this and other
            websites to show more relevant advertising. Where required by law, you will be asked for
            consent before any advertising cookie is set, and you can decline.
          </p>
          <br></br>
          <p>
            Google&apos;s use of advertising cookies is governed by its own policies, which you can
            review at{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              rel="noopener noreferrer"
              target="_blank"
            >
              policies.google.com/technologies/partner-sites
            </a>
            . You can opt out of personalised advertising entirely at{" "}
            <a href="https://adssettings.google.com" rel="noopener noreferrer" target="_blank">
              adssettings.google.com
            </a>
            , or opt out of third-party vendors collectively at{" "}
            <a href="https://optout.aboutads.info" rel="noopener noreferrer" target="_blank">
              optout.aboutads.info
            </a>
            . Opting out does not remove ads; it makes them less relevant.
          </p>
          <br></br>

          <h3><u>Hosting</u></h3>
          <p>
            The site is hosted on Vercel, which keeps standard server access logs including IP
            addresses and request paths for a limited period, for security and abuse prevention.
            This is normal infrastructure logging and applies to the page request itself, not to
            anything you enter into a tool. Vercel&apos;s privacy policy is available at{" "}
            <a href="https://vercel.com/legal/privacy-policy" rel="noopener noreferrer" target="_blank">
              vercel.com/legal/privacy-policy
            </a>
            .
          </p>
          <br></br>

          <h2><u>Cookies</u></h2>
          <p>
            The site itself sets no cookies for its own purposes. There is no login, no session, and
            no preference stored on a server. Cookies present in your browser on this site come from
            Google Analytics and Google AdSense, as described above.
          </p>
          <br></br>
          <p>
            You can block or delete cookies in your browser settings at any time. Doing so does not
            affect any tool: because everything runs locally, the tools work identically with
            cookies fully disabled.
          </p>
          <br></br>

          <h2><u>Your rights</u></h2>
          <p>
            If you are in the European Economic Area or the United Kingdom, the GDPR gives you the
            right to access, correct, delete, or port your personal data, and to object to
            processing. Since I hold no personal data about you directly, most of these requests are
            best directed to Google, which is the controller for the analytics and advertising data
            described above. Google&apos;s tools for this are linked in the sections above.
          </p>
          <br></br>
          <p>
            If you are a California resident, the CCPA gives you the right to know what personal
            information is collected and to opt out of its sale. I do not sell personal information.
            Advertising personalisation can be disabled using the opt-out links above.
          </p>
          <br></br>
          <p>
            If you believe this site holds data about you and want it removed, contact me and I will
            help as far as I am able, which in most cases means pointing you to the right Google
            control.
          </p>
          <br></br>

          <h2><u>Children</u></h2>
          <p>
            This site is aimed at software developers and is not directed at children under 13. I do
            not knowingly collect personal information from children. If you believe a child has
            provided personal information through this site, contact me and I will act on it.
          </p>
          <br></br>

          <h2><u>Security</u></h2>
          <p>
            The site is served exclusively over HTTPS. Because tool input is never transmitted, the
            most common risk associated with online converters — your data sitting in someone
            else&apos;s logs or database — does not apply here.
          </p>
          <br></br>
          <p>
            One caveat worth stating honestly: a tool that is safe does not make a secret safe. If
            you paste a live production credential into the JWT decoder, that credential is still in
            your clipboard and your browser history. Treat it accordingly.
          </p>
          <br></br>

          <h2><u>Changes to this policy</u></h2>
          <p>
            If this policy changes in substance, the date at the top of this page will change with
            it. Material changes — a new analytics provider, a different ad network, anything that
            alters what is collected — will be noted here rather than made quietly.
          </p>
          <br></br>

          <h2><u>Contact</u></h2>
          <p>
            Questions about this policy, or about anything on the site, can go to{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a>. More ways to get in touch are on the{" "}
            <Link href="/contact">contact page</Link>.
          </p>
        </div>
      </article>
    </main>
  );
}
