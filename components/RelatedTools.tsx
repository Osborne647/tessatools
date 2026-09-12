import Link from "next/link";
import { tools } from "@/lib/site-config";

export default function RelatedTools({ current, slugs }: { current: string; slugs: string[] }) {
  const related = slugs
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter((t): t is NonNullable<typeof t> => Boolean(t) && t!.slug !== current);

  if (!related.length) return null;

  return (
    <section className="bg-facet-1">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:px-10">
        <h2 className="font-display text-[24px] font-bold tracking-[-0.03em] text-white">
          Related tools
        </h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3">
          {related.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group block bg-facet-2 px-6 py-7 transition-colors hover:bg-facet-hover odd:bg-facet-3"
            >
              <span className="font-mono text-[12px] tracking-[0.14em] text-teal">{tool.n}</span>
              <h3 className="mt-4 font-display text-[18px] font-medium tracking-[-0.02em] text-white">
                {tool.name}
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{tool.desc}</p>
              <span className="mt-5 inline-block font-mono text-[12px] text-sub transition-colors group-hover:text-teal">
                {tool.cta} →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}