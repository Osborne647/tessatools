export default function TriangleField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg className="tess-drift absolute inset-0 h-full w-full">
        <defs>
          <pattern id="tess" width="120" height="104" patternUnits="userSpaceOnUse">
            <polygon points="60,0 120,104 0,104" fill="none" stroke="#00e5c4" strokeWidth="0.7" />
            <polygon points="0,0 120,0 60,104" fill="none" stroke="#00e5c4" strokeWidth="0.7" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tess)" opacity="0.085" />
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_20%,var(--color-navy)_78%)]" />
    </div>
  );
}
