# alexandredulac.com

Personal website for Alexandre Dulac — Real Estate Sustainability & PropTech Leader.

Built with Next.js 15 (App Router), Tailwind CSS, TypeScript, and Vercel Analytics. Single-page editorial layout, ivory + navy + terracotta palette, Fraunces + JetBrains Mono typography.

---

## 1. Local development (5 min)

Requires Node.js 22.x (see `.nvmrc`) and pnpm.

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev
```

Open http://localhost:3000 to view the site.

To build for production locally:

```bash
pnpm build
pnpm start
```

---

## 2. Deploy to Vercel (10 min, free tier)

### Step 2.1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: alexandredulac.com"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/alexandredulac-com.git
git push -u origin main
```

### Step 2.2 — Connect Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Framework preset: **Next.js** (auto-detected)
4. Click **Deploy** — that's it. Vercel will build and deploy in ~60 seconds.

You will get a default URL like `alexandredulac-com.vercel.app`. Open it to verify everything works.

### Step 2.3 — Add your custom domain

1. In Vercel dashboard → **Project Settings → Domains**
2. Add `alexandredulac.com`
3. Add `www.alexandredulac.com` (Vercel will set it to redirect to the apex domain — and `next.config.js` reinforces this)
4. Vercel will show you the DNS records to configure (see Step 3 below)
5. SSL certificates are issued automatically once DNS propagates

---

## 3. DNS configuration via Cloudflare (15 min)

### Step 3.1 — Move nameservers from Namecheap to Cloudflare

1. Create a free Cloudflare account at https://dash.cloudflare.com/sign-up
2. Add `alexandredulac.com` as a site (Free plan)
3. Cloudflare will scan existing DNS records and give you 2 nameservers (e.g. `barb.ns.cloudflare.com` and `lou.ns.cloudflare.com`)
4. In Namecheap → **Domain List → Manage → Nameservers** → switch to **Custom DNS** and paste the 2 Cloudflare nameservers
5. Wait for propagation (usually 1–24 hours; Cloudflare emails you when ready)

### Step 3.2 — Configure DNS records in Cloudflare

In the Cloudflare DNS dashboard, add these records (delete any existing A or CNAME for the same names):

| Type  | Name | Content                  | Proxy status |
| ----- | ---- | ------------------------ | ------------ |
| A     | @    | `76.76.21.21`            | DNS only (gray cloud) |
| CNAME | www  | `cname.vercel-dns.com.`  | DNS only (gray cloud) |

> **Important:** Set Proxy status to **DNS only** (gray cloud), NOT proxied (orange cloud). Vercel handles its own SSL and CDN — proxying through Cloudflare on top will break things.

Once DNS propagates (5–30 minutes), Vercel will automatically issue SSL certificates and your site will be live at:
- `https://alexandredulac.com` ← canonical
- `https://www.alexandredulac.com` → 301 redirect to apex (handled by `next.config.js`)

---

## 4. Email routing — `alexandre@alexandredulac.com` (free)

Cloudflare Email Routing forwards emails to your existing Gmail at no cost.

1. In Cloudflare dashboard → **Email → Email Routing → Get started**
2. Cloudflare adds the necessary MX and TXT records automatically
3. Create a route: `alexandre@alexandredulac.com` → forward to `adulac@gmail.com`
4. Verify the destination address (you'll get a confirmation email at `adulac@gmail.com`)
5. Optional aliases to set up: `hello@`, `contact@`, `hi@` — all forwarded to the same destination

To **send** from `alexandre@alexandredulac.com` via Gmail, you'll need a relay (Cloudflare Email Routing is receive-only). Two options:
- **Free:** use a Gmail SMTP setup with an app password (15 min config in Gmail Settings → Accounts → "Send mail as")
- **Paid ($7/month):** upgrade to Google Workspace for full inbox/calendar/drive — recommended for an active job hunt

---

## 5. Vercel Analytics

Already wired up via `@vercel/analytics` in `app/layout.tsx`. Once deployed:

1. Vercel dashboard → your project → **Analytics** tab
2. Click **Enable** (free tier includes 2,500 events/month, plenty for a personal site)
3. You will see real-time traffic, top pages, top referrers, and devices

GDPR-friendly, no cookies, no consent banner needed.

---

## 6. Updating content

Most edits happen in two files:

- **`app/page.tsx`** — all visible content (engagements, tracks, headlines, contact)
- **`app/layout.tsx`** — SEO metadata (title, description, Open Graph)

After editing, push to GitHub and Vercel auto-deploys in ~45 seconds.

---

## 7. File structure

```
alexandredulac-site/
├── app/
│   ├── globals.css       # Tailwind + custom CSS (fonts, grain, animations)
│   ├── layout.tsx        # Root layout, SEO metadata, Analytics
│   ├── page.tsx          # The single-page site
│   ├── robots.ts         # robots.txt generator
│   └── sitemap.ts        # sitemap.xml generator
├── public/               # Static assets (favicon, og-image — to add later)
├── .gitignore
├── next.config.js        # www → apex redirect
├── package.json
├── postcss.config.js
├── tailwind.config.ts    # Palette + fonts
├── tsconfig.json
└── README.md
```

---

## 8. Things to add later (optional, in order of value)

1. **Favicon** — drop `favicon.ico` (32×32) in `app/` directory. Use https://realfavicongenerator.net for a full set.
2. **Open Graph image** — drop `opengraph-image.png` (1200×630) in `app/` for rich previews when the site is shared on LinkedIn / Slack / Twitter. Currently LinkedIn will fall back to your profile photo for the rich preview, which is fine to start.
3. **Resume PDF download** — drop your CV at `public/Dulac_Alexandre_Resume.pdf` and add a link in `app/page.tsx` next to the contact buttons.
4. **Case studies** — if you want to expand individual engagements (SEGRO, Adobe, Capital 8) into dedicated pages, create `app/work/[slug]/page.tsx`.
5. **Blog or essays** — `app/notes/[slug]/page.tsx` with MDX support if you want to publish thinking on LL97 / European energy compliance / PropTech. Strong SEO play if you commit to it.

---

## 9. Costs summary

| Item                          | Cost         |
| ----------------------------- | ------------ |
| Domain (Namecheap, paid)      | ~$12/year    |
| Vercel hosting (Hobby plan)   | Free         |
| Cloudflare DNS + Email routing| Free         |
| Vercel Analytics              | Free         |
| Google Workspace (optional)   | ~$7/month    |
| **Total minimum**             | **$1/month** |

---

Built April 2026. Direct questions to alexandre@alexandredulac.com (once routing is live).
