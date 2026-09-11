import type { Metadata } from "next";
import { Space_Grotesk, DM_Mono, Inter } from "next/font/google";
import { site } from "@/lib/site-config";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

// next/font self-hosts these at build time: no render-blocking request to
// Google, no layout shift. Each exposes a CSS variable that globals.css maps
// onto a Tailwind font utility.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  // Makes every relative URL below (canonical, OG image) absolute.
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Free Developer Tools That Run in Your Browser`,
    // Every child page sets just its own title; this appends the brand.
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — Free Developer Tools`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Free Developer Tools`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmMono.variable} ${inter.variable}`}>
      <body className="bg-navy font-sans text-white antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
