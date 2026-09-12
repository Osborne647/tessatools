import Link from "next/link";

export default function Breadcrumb({ crumb }: { crumb: string }) {
  return (
    <nav aria-label="Breadcrumb" className="font-mono text-[12px] text-sub">
      <Link href="/" className="transition-colors hover:text-teal">
        Tools
      </Link>
      <span className="px-2 text-line">/</span>
      <span aria-current="page" className="text-muted">
        {crumb}
      </span>
    </nav>
  );
}