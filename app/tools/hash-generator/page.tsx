import type { Metadata } from "next";
import HashTool from "@/components/HashTool";
import Breadcrumb from "@/components/Breadcrumb";
import Faq from "@/components/Faq";
import RelatedTools from "@/components/RelatedTools";
import TriangleField from "@/components/TriangleField";
import { faqJsonLd, getTool, site, toolJsonLd } from "@/lib/site-config";

// Server component. It owns metadata and structured data; the interactive part
// is isolated in <HashTool />, the page's only client bundle.
const tool = getTool("hash-generator")!;

export const metadata: Metadata = {
  title: tool.h1,
  description: tool.metaDescription,
  keywords: [
    tool.keyword,
    "md5 hash generator",
    "sha512 generator",
    "checksum calculator",
    "hmac generator",
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

export default function HashPage() {
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
          <h1 className="mt-6 max-w-[17ch] font-display text-[44px] font-bold leading-[0.96] tracking-[-0.04em] text-white sm:text-[68px]">
            Free SHA-256 Hash Generator
          </h1>

          <p className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-muted">
            Hash text or any file with MD5, SHA-1, SHA-256, SHA-384, and SHA-512 at once. Paste a
            checksum to verify a download, or add a secret for HMAC. Everything runs in this tab.
          </p>

          <div className="mt-10">
            <HashTool />
          </div>
        </div>
      </section>

      {/* Supporting content: ~540 words of genuinely useful copy. This is what
          separates a page that ranks from a thin tool page that gets filtered. */}
      <article className="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
        <div className="max-w-[72ch] border-t border-line pt-14">
          <h2 className="font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            What a hash function actually does
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            A cryptographic hash takes input of any length and produces a fixed-length digest. Three
            properties make that useful. It is deterministic, so the same input always yields the
            same digest. It is one-way, so you cannot compute the input from the output. And it is
            avalanche-sensitive: flip a single bit of the input and roughly half the output bits
            change.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            That last property is why hashes work as fingerprints. Change one byte in a 4 GB ISO and
            the SHA-256 digest is unrecognisably different, which is exactly what you want when
            verifying that a download arrived intact.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Which algorithm to pick
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">SHA-256</strong> is the default answer.
            It is fast, universally supported, and has no known practical attacks. Reach for
            <strong className="font-medium text-white"> SHA-512</strong> when you want a longer
            digest; on 64-bit hardware it is often faster than SHA-256 despite doing more work.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            <strong className="font-medium text-white">MD5 and SHA-1 are broken.</strong> Not
            theoretically, practically. MD5 collisions can be generated on a laptop in seconds, and
            SHA-1 fell to the SHAttered attack in 2017. Anyone who can choose the input can craft
            two different files with identical digests, which defeats every security use. They
            survive here for one legitimate reason: plenty of older projects still publish MD5
            checksums, and verifying one is a non-adversarial check where collision resistance does
            not matter.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            Worth noting that the Web Crypto API deliberately omits MD5, so the implementation on
            this page is hand-written. It is validated against the RFC 1321 test vectors.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Never hash a password with these
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            This is the most consequential mistake on the topic, so it deserves saying plainly.
            SHA-256 is the wrong tool for storing passwords, and it is wrong precisely because it is
            good at its job: it is fast. Modern hardware computes billions of SHA-256 digests per
            second, so an attacker holding your database can brute-force common passwords almost
            instantly.
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-muted">
            Password hashing needs an algorithm designed to be slow and memory-hungry, with a unique
            salt per user so one precomputed table cannot attack every account at once. Use
            <strong className="font-medium text-white"> Argon2id</strong> where available, or
            bcrypt and scrypt, all of which handle salting for you. If you find yourself writing
            <code className="mx-1.5 bg-facet-3 px-1.5 py-0.5 font-mono text-[14px] text-teal">
              sha256(password)
            </code>
            , stop.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            Doing it in code
          </h2>
          <pre className="mt-5 overflow-x-auto bg-facet-1 p-5 font-mono text-[13.5px] leading-relaxed text-muted">
            <code>{`// Browser — Web Crypto, async and hardware-accelerated
const bytes = new TextEncoder().encode("hello");
const buf = await crypto.subtle.digest("SHA-256", bytes);
const hex = [...new Uint8Array(buf)]
  .map((b) => b.toString(16).padStart(2, "0")).join("");

// Node
import { createHash } from "node:crypto";
createHash("sha256").update("hello").digest("hex");

// Shell
shasum -a 256 file.iso
sha256sum file.iso        # Linux`}</code>
          </pre>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            One gotcha in the browser: Web Crypto offers SHA-1, SHA-256, SHA-384, and SHA-512, but
            not MD5. If you need MD5 you must bring your own implementation. Another: always compare
            digests with a constant-time function when the comparison is security-relevant, since a
            naive string equality check leaks information through timing.
          </p>

          <h2 className="mt-14 font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
            HMAC, in one paragraph
          </h2>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted">
            A plain hash proves data has not changed. It does not prove who produced it, because
            anyone can compute one. HMAC fixes that by mixing a secret key into the digest, so only
            a holder of the key can generate or verify it. This is how Stripe, GitHub, and most
            webhook providers sign their payloads: you recompute the HMAC with your shared secret
            and compare, which confirms both integrity and origin. Toggle HMAC above and supply a
            secret to see it.
          </p>
        </div>

        <div className="mt-16 max-w-[72ch]">
          <Faq items={tool.faqs} />
        </div>
      </article>

      <RelatedTools
        current={tool.slug}
        slugs={["jwt-decoder", "base64-encoder", "uuid-generator"]}
      />
    </main>
  );
}
