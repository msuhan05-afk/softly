# Buzzora — Raw Honey from the Valleys of Jammu & Kashmir

E-commerce website for **Buzzora**, founded by Kannu Priya. From hive to jar —
nothing added, nothing taken away.

Built with **Next.js 14 (App Router) + Tailwind CSS**, designed to deploy on
**Vercel** with the business's existing domain.

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build
```

## What's included (MVP)

- **Home** — hero, product highlights, honey finder quiz, brand statement,
  hive-to-jar timeline, J&K origin story, journal preview, Instagram + wholesale CTAs
- **/shop** — product grid with honey-type filter and price sorting
- **/products/[slug]** — size selection, quantity, Add to Cart / Buy Now
  (sticky on mobile), detail accordions, related products, Product JSON-LD
- **Cart drawer** — persisted in localStorage
- **/checkout** — shipping form + order summary; orders are validated and
  priced **server-side** (`app/api/orders`) and never trust client totals
- **/order-success** — order confirmation
- **/about**, **/hive-to-jar**, **/journal** (+ 5 articles), **/wholesale**
- WhatsApp floating button (renders only when a real number is configured)
- Organization / Product / Article structured data, per-page metadata, sitemap

## Before launch — placeholders to replace

All placeholder data lives in `lib/products.js` and is clearly marked:

- **Prices, weights, SKUs, stock** — currently placeholder values
- **Shipping rules** — `app/api/orders/route.js` (currently ₹0 / "confirmed with order")
- **WhatsApp number / contact email / domain** — set via `.env.local` (see `.env.example`)
- **Product & brand photography** — the illustrated jar (`components/JarVisual.jsx`)
  is a stand-in until real photos are added
- **Customer reviews** — intentionally omitted until genuine reviews exist

No certifications, health claims, or statistics have been invented anywhere.

## Payments

The checkout is **provider-agnostic**. Today orders are created as
`pending-confirmation` (manual/COD confirmation by the business). To enable
online payment:

1. Set `PAYMENT_PROVIDER=razorpay` (India-first) or `stripe` (international)
   plus the keys in `.env.local`.
2. Create the provider order server-side in `app/api/orders/route.js` and
   return its id to the client for the hosted checkout/payment element.
3. Mark orders paid **only from the provider webhook** (signature-verified) —
   never from client-side success callbacks.

Card details are never touched by this codebase — use the provider's hosted
checkout / elements.

## Deploying to Vercel

1. Push this repo to GitHub and import it into Vercel.
2. Add the env vars from `.env.example` in Vercel → Project → Settings →
   Environment Variables.
3. Add the existing domain under Settings → Domains; point DNS as instructed
   (A/ALIAS for apex, CNAME for `www`). Choose one canonical host — Vercel
   automatically redirects the other. HTTPS is provisioned automatically.
4. Set `NEXT_PUBLIC_SITE_URL` to the canonical URL and redeploy.
