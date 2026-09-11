import Link from "next/link";

// The one breadcrumb. Every tool page and every static page renders this, so
// changing the separator, the spacing, or the root label is a single edit.
//
// The root links to "/" rather than to a /tools index, because the homepage IS
// the tool index. There is no intermediate listing page to point at.
export default function Breadcrumb({ crumb }: { crumb: string }) {
  return (
    <nav aria-label="Breadcrumb" className="font-mono text-[12px] text-sub">
      <Link href="/" className="transition-colors hover:text-teal">
        Tools
      </Link>
      <span className="px-2 text-line">/</span>
      {/* Current page: text, not a link, per the ARIA breadcrumb pattern. */}
      <span aria-current="page" className="text-muted">
        {crumb}
      </span>
    </nav>
  );
}