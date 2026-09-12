import Breadcrumb from "./Breadcrumb";
import TriangleField from "./TriangleField";

export default function PageHeader({
  crumb,
  title,
  intro,
}: {
  crumb: string;
  title: string;
  intro: string;
}) {
  return (
    <section className="relative">
      <TriangleField />
      <div className="relative mx-auto max-w-6xl px-6 pb-10 pt-8 sm:px-10 sm:pb-14 sm:pt-12">
        <Breadcrumb crumb={crumb} />

        <h1 className="mt-6 max-w-[20ch] font-display text-[44px] font-bold leading-[0.96] tracking-[-0.04em] text-white sm:text-[64px]">
          {title}
        </h1>

        <p className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-muted">{intro}</p>
      </div>
    </section>
  );
}
