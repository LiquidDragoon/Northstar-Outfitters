# Frontend Architecture — Storefront & Customer Experience

**Project:** Northstar Outfitters — E-Commerce Platform Modernization  
**Stack:** Next.js (App Router), React 19+, TypeScript, Tailwind CSS, TanStack Query  
**Status:** DRAFT — FOR ARCHITECTURE REVIEW

---

## 1. Architectural Overview & Rendering Strategy

The Northstar Outfitters Storefront is a headless web application architected to deliver ultra-fast, visually immersive e-commerce experiences tailored to outdoor enthusiasts.

```text
[ Browser / Mobile Client ]
             │
             ▼
    [ CloudFront CDN ]
    ├── Cache Hit: Static Assets, SSG/ISR Pages (Hero Landings, PDPs)
    └── Cache Miss / Dynamic: Next.js App Router (ECS Fargate)
                                     │
                                     ├── React Server Components (RSC)
                                     ├── Edge-Hydrated Client Islands (Cart, Checkout)
                                     │
                                     ▼
                        [ Backend Modular Monolith ]
                           (/api/v1/storefront/*)
```

### Hybrid Rendering Strategy

| Route Type | Pattern | Rendering Method | Cache / Invalidation Strategy |
| :--- | :--- | :--- | :--- |
| **Marketing Landings & Home** | `/` , `/landings/[slug]` | **ISR (Incremental Static Regeneration)** | Revalidate every 300s + on-demand webhook invalidation on CMS publish. |
| **Category & Collection Pages** | `/categories/[slug]` | **ISR / SSR Hybrid** | Static shell with client-side faceted filtering (price, size, brand). |
| **Product Detail Pages (PDP)** | `/products/[slug]` | **ISR + Dynamic Client Hydration** | Pre-rendered product descriptions & imagery; real-time sellable stock and price hydrated via TanStack Query. |
| **Cart Drawer & Checkout** | `/cart`, `/checkout` | **Client-Side SPA Island** | Dynamic client execution; zero CDN caching; secured via HTTPS & CSRF protection. |
| **Customer Account Portal** | `/account/*` | **Authenticated Client Island** | Protected by JWT token in HttpOnly cookie; fetches profile and order history. |

---

## 2. Directory Structure (Next.js App Router)

```text
storefront/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                    # Homepage
│   │   └── landings/[slug]/page.tsx    # Dynamic Marketing Landing Pages
│   ├── (shop)/
│   │   ├── categories/[slug]/page.tsx  # Category Grid & Faceted Filters
│   │   └── products/[slug]/page.tsx    # Product Detail Page (PDP)
│   ├── (checkout)/
│   │   ├── cart/page.tsx               # Cart Overview
│   │   └── checkout/page.tsx           # Multi-Step Single-Page Checkout
│   ├── (account)/
│   │   └── account/                    # Orders, Addresses, Security Settings
│   ├── api/                            # Next.js BFF routes (auth proxy, session)
│   ├── layout.tsx                      # Global Navigation, Footer, Mini-Cart Drawer
│   └── globals.css                     # Tailwind design tokens & brand theme
├── components/
│   ├── ui/                             # Base primitives (Button, Modal, Input, Badge)
│   ├── landings/                       # Marketing block registry (Hero, Grids, Editorial)
│   ├── product/                        # ProductCard, PriceTag, StockBadge, Gallery
│   └── cart/                           # MiniCartDrawer, CartItemRow, OrderSummary
├── lib/
│   ├── api-client.ts                   # Type-safe Fetch wrapper for Backend API
│   ├── hooks/                          # useCart, useInventory, useAuth
│   └── utils/                          # Currency formatting, image url builders
└── types/                              # Auto-generated TypeScript types from OpenAPI
```

---

## 3. State Management & Data Fetching

1. **Server-Side Data Fetching:** React Server Components (RSC) fetch catalog and landing page data directly during render with native `fetch` caching and tag-based revalidation (`next: { tags: ['landing-slug'] }`).
2. **Client-Side Reactive State (Cart & Checkout):**
   - **Zustand** for lightweight global UI state (mini-cart drawer open/close, mobile filter slide-outs).
   - **TanStack Query (React Query)** for server-state synchronization (cart item mutations, real-time inventory validation, checkout step submission) with automated retries and optimistic updates.
3. **Cart Synchronization Lifecycle:**
   - Anonymous session ID stored in secure cookie (`nso_cart_session`).
   - Adding items dispatches an optimistic UI update, then synchronizes with `/api/v1/storefront/cart`.
   - On customer sign-in, the client sends a `merge-cart` command to assimilate guest items into the user's permanent profile cart.

---

## 4. Performance & Core Web Vitals Optimization

To maintain Google Lighthouse scores above 90:

1. **Image Delivery:**
   - All outdoor photography delivered via Next.js `next/image` connected to CloudFront.
   - Automatic format negotiation to **AVIF / WebP** with dynamic responsive `srcset` generation.
   - Fixed aspect ratios and explicit `blurDataURL` placeholders to eliminate Cumulative Layout Shift (CLS < 0.05).
2. **Font Optimization:**
   - Self-hosted brand typography loaded via `next/font/google` or local fonts with `font-display: swap` to prevent Flash of Invisible Text (FOIT).
3. **Script Optimization:**
   - Third-party tracking scripts (Google Analytics 4, Meta Pixel) loaded strictly via `next/script` with `strategy="afterInteractive"` or `strategy="lazyOnload"`.

---

## 5. Security & Checkout PCI Scoping

1. **PCI-DSS SAQ A Minimization:**
   - Credit card details are never input into plain HTML inputs controlled by our application.
   - Integration uses hosted gateway iframes / elements (e.g. Stripe Elements). The browser receives a secure payment method token and transmits only the token to our backend checkout API.
2. **Content Security Policy (CSP):**
   - Strict HTTP headers configured in Next.js middleware restricting script execution domains, iframe origins (whitelisting only the approved payment gateway), and connection endpoints.
