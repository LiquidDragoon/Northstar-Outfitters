# ADR-009 — Frontend Storefront Architecture (Next.js, SSR, and Headless Commerce)

**Status:** Accepted  
**Date:** September 2026  
**Deciders:** Lead Solutions Architect, Frontend Architect  

## Context

Northstar Outfitters' revenue relies on organic search visibility (SEO) for outdoor gear, fast visual browsing, and high-converting marketing campaigns. The legacy platform suffered from slow initial page loads, rigid server-rendered HTML templates, and poor mobile UX. We need a modern frontend stack that delivers sub-second Core Web Vitals, rich product visuals, and seamless shopping cart interactions.

## Decision Drivers

- **SEO & Social Sharing:** Product pages and marketing landings must have full pre-rendered HTML for search bot crawlers and OpenGraph rich cards.
- **Performance & Core Web Vitals:** Largest Contentful Paint (LCP) < 2.5s, First Input Delay (FID) < 100ms, and Cumulative Layout Shift (CLS) < 0.1.
- **Developer Velocity & Ecosystem:** Rich UI component ecosystem, TypeScript type-safety, and strong community support.
- **Headless Decoupling:** Storefront developers can iterate on UI, animations, and marketing pages without touching backend Java code.

## Considered Options

1. **Monolithic Server-Side Templates (Thymeleaf / JSP within Spring Boot):**
   - *Pros:* Single repository, no separate Node.js runtime.
   - *Cons:* Poor modern component reusability; slow client-side transitions; difficult to hire modern frontend engineers; poor developer experience.
2. **Pure Single-Page Application (SPA with React / Vite):**
   - *Pros:* Fast client-side navigation.
   - *Cons:* Sub-optimal SEO indexing; initial white screen during JS bundle download; slow LCP for search visitors.
3. **Next.js (React) with Hybrid SSR / SSG / ISR (Selected):**
   - *Pros:* Best-in-class SEO; pre-rendering for product and landing pages (Incremental Static Regeneration); React Server Components for minimal client JS; native image optimization.

## Decision

We adopt a **Headless Architecture using Next.js (App Router, React 19+, TypeScript)**:

1. **Rendering Strategy:**
   - **Marketing Landings & Category Pages:** Statically pre-rendered with **ISR (Incremental Static Regeneration)** (e.g. revalidate every 300 seconds).
   - **Product Detail Pages (PDP):** Hybrid SSR with edge-cached dynamic stock/pricing hydration.
   - **Cart, Checkout, and Customer Portal:** Client-rendered dynamic components interacting with the backend REST API via a lightweight typed client.
2. **Styling & Design System:**
   - **Tailwind CSS** paired with **Radix UI / Shadcn UI primitives** for accessible, responsive, and brand-tailored outdoor aesthetic components.
3. **Image Optimization:**
   - Next.js `next/image` component integrated with CloudFront/S3 to serve modern AVIF/WebP formats resized dynamically to user viewport dimensions.
4. **Hosting:**
   - Deployed as a containerized Node.js service on AWS ECS/Fargate in private subnets, fronted by Amazon CloudFront CDN.

## Consequences

### Positive
- Outstanding SEO and lighthouse performance scores (95+).
- Rapid UI experimentation and marketing landing page launches.
- Clean separation between presentation concerns and core business transactions.

### Negative
- Introduces a second runtime technology (Node.js/TypeScript) alongside Java 21.
- Requires team coordination on OpenAPI contract definitions.
