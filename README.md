# tessacodetools.dev — homepage starter

Drop-in files for the Next.js App Router. Everything is a server component
except `components/HeroTool.tsx`.

## 1. Create the project

```bash
npx create-next-app@latest tessacodetools \
  --ts --tailwind --app --eslint --import-alias "@/*" --no-src-dir
cd tessacodetools
```

## 2. Copy these files in

Overwrite `app/layout.tsx`, `app/page.tsx`, and `app/globals.css`. The rest are
new:

```
app/globals.css      brand tokens (@theme) + the drift keyframes
app/layout.tsx       fonts, metadata defaults, header/footer shell
app/page.tsx         the homepage
app/sitemap.ts       auto-generated /sitemap.xml
app/robots.ts        /robots.txt
lib/site-config.ts   ALL SEO copy for all 10 tools — the one file you edit
lib/base64.ts        encode/decode logic, framework-free
components/          Header, Footer, Mark, TriangleField, HeroTool, ToolGrid
next.config.ts       static export config
```

Delete the `app/page.module.css` that create-next-app generates.

## 3. Run it

```bash
npm run dev      # http://localhost:3000
npm run build    # static HTML into ./out
```

## 4. Deploy

Push to GitHub, import the repo at vercel.com, accept the defaults. Point the
domain at it in Vercel's dashboard.

## How the SEO layer works

`lib/site-config.ts` is the single source of truth. Each tool carries its own
`h1`, `metaDescription`, and `faqs`. When you build a tool page, read from
`getTool(slug)` and emit `toolJsonLd()` + `faqJsonLd()` into script tags. The
sitemap picks up any tool with `status: "live"` automatically, so shipping a
tool is: write the page, flip the status, push.

## Next up

`app/tools/base64-encoder/page.tsx` — server component owning the metadata,
rendering a fuller version of `HeroTool` plus 400-600 words of supporting copy
and the FAQ block from site-config.
