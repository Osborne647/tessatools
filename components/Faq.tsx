import type { Faq as FaqItem } from "@/lib/site-config";

export default function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div>
      <h2 className="font-display text-[30px] font-bold tracking-[-0.035em] text-white sm:text-[38px]">
        Frequently asked questions
      </h2>
      <div className="mt-8">
        {items.map((item) => (
          <details key={item.q} className="group border-t border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-[17px] font-medium text-white transition-colors hover:text-teal">
              {item.q}
              <span className="shrink-0 font-mono text-[18px] text-teal transition-transform duration-300 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="max-w-[72ch] pb-6 text-[15px] leading-relaxed text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
