export default function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="tessacode-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1b4a63" />
          <stop offset="100%" stopColor="#00e5c4" />
        </linearGradient>
      </defs>
      <polygon points="2,3 11,3 6.5,11" fill="#00e5c4" opacity="0.5" />
      <polygon points="11,3 2,11 11,11" fill="url(#tessacode-mark)" />
      <polygon points="11,3 21,3 16,11" fill="url(#tessacode-mark)" />
      <polygon points="21,3 30,3 25.5,11" fill="#00e5c4" opacity="0.5" />
      <polygon points="21,3 11,11 21,11" fill="url(#tessacode-mark)" />
      <polygon points="30,3 21,11 30,11" fill="url(#tessacode-mark)" />
      <polygon points="12.5,12 19.5,12 16,29" fill="url(#tessacode-mark)" />
    </svg>
  );
}
