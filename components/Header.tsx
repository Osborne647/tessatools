import Link from "next/link";
import Mark from "./Mark";

export default function Header() {
  return (
    <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
      <Link href="/" className="flex items-center gap-2.5">
        <Mark size={26} />
        <span className="font-display text-[28px] font-bold tracking-[-0.02em] text-white">
          TessaCode<span className="text-teal">Tools</span>
        </span>
      </Link>

      <nav className="flex items-center gap-7 font-mono text-[18px] text-muted">
        <Link href="/#tools" className="transition-colors hover:text-white">
          Tools
        </Link>
        <Link href="/#why" className="hidden transition-colors hover:text-white sm:block">
          Why
        </Link>
      </nav>
    </header>
  );
}
