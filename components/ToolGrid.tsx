import Link from "next/link";
import { tools } from "@/lib/site-config";

// Facet tints cycle so adjacent tiles differ without any gap or border between
// them. The grid has no gap on purpose: the tessellation is the separator.
const FACETS = ["bg-facet-1", "bg-facet-2", "bg-facet-3", "bg-navy"];

export default function ToolGrid() {
  return (
    <div className="grid grid-cols-1 overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool, i) => {
        const facet = FACETS[(i + Math.floor(i / 3)) % FACETS.length];

        return (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className={`group relative block overflow-hidden px-6 py-7 transition-colors duration-300 hover:bg-facet-hover sm:px-8 sm:py-9 ${facet}`}
          >
            <svg
              className="pointer-events-none absolute -right-6 -top-6 transition-transform duration-500 ease-out group-hover:-translate-x-1.5 group-hover:translate-y-1.5"
              width="120"
              height="120"
              viewBox="0 0 120 120"
              aria-hidden="true"
            >
              <polygon
                points="120,0 120,120 0,0"
                fill="#00e5c4"
                className="opacity-[0.028] transition-opacity duration-300 group-hover:opacity-[0.07]"
              />
            </svg>

            <span className="font-mono text-[12px] tracking-[0.14em] text-teal">{tool.n}</span>

            <h3 className="mt-5 font-display text-[21px] font-medium leading-tight tracking-[-0.02em] text-white">
              {tool.name}
            </h3>
            <p className="mt-3 max-w-[34ch] text-[14px] leading-relaxed text-muted">{tool.desc}</p>

            <div className="mt-6 flex items-center gap-2">
              <span className="font-mono text-[12px] text-sub transition-colors group-hover:text-teal">
                {tool.cta}
              </span>
              <svg
                width="14"
                height="10"
                viewBox="0 0 14 10"
                fill="none"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <path
                  d="M0 5h12M9 1.5 12.5 5 9 8.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="square"
                  className="text-sub group-hover:text-teal"
                />
              </svg>
            </div>
          </Link>
        );
      })}

      {/* 10 tools across 3 columns leaves 2 empty cells, which breaks the
          tessellation. This tile spans both and closes the pattern. */}
      <div className="flex flex-col gap-6 bg-navy-deep px-6 py-7 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-9">
        <div>
          <span className="font-mono text-[12px] tracking-[0.14em] text-sub">11+</span>
          <h3 className="mt-4 font-display text-[21px] font-medium leading-tight tracking-[-0.02em] text-white">
            Something missing?
          </h3>
          <p className="mt-3 max-w-[44ch] text-[14px] leading-relaxed text-sub">
            Tell us which tool you keep googling and it goes on the build list.
          </p>
        </div>
        <Link
          href="/contact"
          className="shrink-0 bg-facet-3 px-5 py-3 font-mono text-[13px] text-teal transition-colors hover:bg-facet-hover"
        >
          Request a tool →
        </Link>
      </div>
    </div>
  );
}