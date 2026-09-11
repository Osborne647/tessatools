import Link from "next/link";
import Mark from "./Mark";
import { site } from "@/lib/site-config";

export default function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Mark size={30} />
          <div>
            <p className="font-display text-[24px] font-bold text-white">{site.brand}</p>
            <p className="font-mono text-[16px] text-teal">{site.tagline}</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-6 font-mono text-[16px] text-muted">
          <Link href="/about" className="transition-colors hover:text-white">About</Link>
          {/* AdSense requires a real privacy policy. Write it before you apply. */}
          <Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link>
          <Link href="/contact" className="transition-colors hover:text-white">Contact</Link>
          <span className="text-sub">© 2026</span>
        </nav>
      </div>
    </footer>
  );
}
