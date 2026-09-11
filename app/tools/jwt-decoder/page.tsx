import type { Metadata } from "next";
import JwtTool from "@/components/JwtTool";
import Breadcrumb from "@/components/Breadcrumb";
import Faq from "@/components/Faq";
import RelatedTools from "@/components/RelatedTools";
import TriangleField from "@/components/TriangleField";
import { faqJsonLd, getTool, site, toolJsonLd } from "@/lib/site-config";

// Server component. It owns metadata and structured data; the interactive part
// is isolated in <JwtTool />, the page's only client bundle.
const tool = getTool("jwt-decoder")!;

export const metadata: Metadata = {
  title: tool.h1,
  description: tool.metaDescription,
  keywords: [
    tool.keyword,
    "decode jwt",
    "jwt viewer",
    "json web token decoder",
    "verify jwt signature",
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

export default function JwtPage() {
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
          <h1 className="mt-6 max-w-[16ch] font-display text-[44px] font-bold leading-[0.96] tracking-[-0.04em] text-white sm:text-[68px]">
            Free Online JWT Decoder
          </h1>

          <p className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-muted">
            Read the header, payload, and expiry of any JSON Web Token, and optionally verify an
            HS256 signature with your shared secret. Everything happens in this tab, so the token
            never leaves your machine.
          </p>

          <div className="mt-10">
            <JwtTool />
          </div>
        </div>
      </section>

      {/* Supporting content: ~540 words of genuinely useful copy. This is what
          separates a page that ranks from a thin tool page that gets filtered. */}
      <article className="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
        <div className="max-w-[72ch] border-t border-line pt-14">
          <h2 className="font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            What is inside a JWT
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            A JSON Web Token is three base64url-encoded strings joined by dots. The
            <strong className="font-medium text-white"> header</strong> says which algorithm signed
            it and, often, which key was used. The
            <strong className="font-medium text-white"> payload</strong> carries the claims: who the
            token is about, who issued it, when it expires, plus whatever application data the
            issuer chose to include. The
            <strong className="font-medium text-white"> signature</strong> is a cryptographic hash
            over the first two parts, and it is the only thing standing between a real token and a
            forged one.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            The critical point, and the one most often misunderstood: a JWT is
            <strong className="font-medium text-white"> encoded, not encrypted</strong>. Anyone
            holding the token can read every claim in it without any key at all, which is exactly
            what the decoder above does. Never put a password, a private key, or anything else
            sensitive in a payload.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Decoding is not verifying
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            Reading a token tells you what it claims. Verifying it tells you whether to believe
            those claims. They are entirely separate operations, and conflating them is the root of
            most JWT vulnerabilities.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            Verification means recomputing the signature and checking that the expected value
            matches. With HMAC algorithms (HS256, HS384, HS512) the signer and verifier share one
            secret, so this page can do the check locally once you supply it. With RSA and ECDSA
            (RS256, ES256) the token is verified using the issuer&apos;s public key, which normally
            requires fetching a JWKS document. That would mean sending your token somewhere, so
            this tool declines rather than compromise the privacy guarantee.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            The claims that matter
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            Seven claim names are registered by the spec, and each is a
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              exp
            </code>
            -style three-letter abbreviation:
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">iss</code>
            (issuer),
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">sub</code>
            (subject),
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">aud</code>
            (audience),
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">exp</code>
            (expiry),
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">nbf</code>
            (not before),
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">iat</code>
            (issued at), and
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">jti</code>
            (token id). All three time claims are Unix timestamps in seconds, not milliseconds,
            which is a reliable source of off-by-1000 bugs.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            The decoder above resolves those timestamps to readable dates and tells you how long
            until expiry, flagging anything inside five minutes. It also separates registered claims
            from custom ones, since custom claims are usually where the roles and permissions your
            application actually cares about live.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Three ways JWT auth goes wrong
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">Trusting the header.</strong> If your
            verifier reads
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              alg
            </code>
            out of the token and uses whatever it finds, an attacker can set it to
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              none
            </code>
            , strip the signature, and walk in. Pin the expected algorithm in your server config.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">Long expiry windows.</strong> A JWT cannot be
            revoked, because verification is offline by design. A token valid for thirty days is a
            thirty-day breach if it leaks. Keep access tokens to minutes and use refresh tokens for
            longevity.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">Storing them in localStorage.</strong> Any
            cross-site scripting flaw on your domain can read localStorage and exfiltrate the token.
            An httpOnly, secure, SameSite cookie is not reachable from JavaScript at all.
          </p>
        </div>

        <div className="mt-16 max-w-[72ch]">
          <Faq items={tool.faqs} />
        </div>
      </article>

      <RelatedTools
        current={tool.slug}
        slugs={["base64-encoder", "timestamp-converter", "hash-generator"]}
      />
    </main>
  );
}
