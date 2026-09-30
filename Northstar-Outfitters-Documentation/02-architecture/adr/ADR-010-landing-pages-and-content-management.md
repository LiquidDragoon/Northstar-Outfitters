# ADR-010 — Dynamic Landing Pages and Content Management Strategy

**Status:** Accepted  
**Date:** September 2026  
**Deciders:** Lead Solutions Architect, Marketing Lead, Frontend Architect  

## Context

Northstar Outfitters frequently runs seasonal outdoor marketing campaigns (e.g. "Fall Trail Running", "Winter Mountaineering Summit Sale", "Paddle & Kayak Season Kickoff"). In the legacy platform, launching a new landing page required developer code changes, template edits, and a full production deployment. This operational friction caused missed marketing windows.

The new platform must empower the marketing and content teams to build, edit, schedule, and publish rich promotional landing pages without developer intervention.

## Decision Drivers

- **Zero-Code Marketing Agility:** Content creators must assemble landing pages using pre-approved, brand-compliant UI blocks.
- **Scheduled Publishing:** Campaigns must automatically go live and retire at specified dates/times.
- **Brand Consistency:** Non-technical users cannot break the responsive layout, accessibility, or typography of Northstar Outfitters.
- **Architecture Simplicity:** Avoid maintaining a heavy self-hosted WordPress/Drupal cluster.

## Considered Options

1. **Hardcoded React Landing Pages in Storefront Repository:**
   - *Pros:* Zero external licensing cost.
   - *Cons:* Directly perpetuates developer dependency for every marketing promotion.
2. **Heavyweight Self-Hosted CMS (e.g. WordPress, Drupal):**
   - *Pros:* Massive plugin library.
   - *Cons:* Security vulnerability risks, database management overhead, poor integration with headless e-commerce.
3. **Headless CMS with Structured Component Blocks (Selected):**
   - *Option A (SaaS):* Sanity.io / Strapi Cloud / Contentful.
   - *Option B (Lightweight Internal CMS Module):* JSON-backed modular page builder within the modular monolith, with frontend rendering components.
   - *Decision:* Clean headless interface abstraction (`ContentDeliveryPort`) allowing either a lightweight internal CMS module or a managed SaaS Headless CMS (e.g., Strapi / Sanity).

## Decision

We adopt a **Structured Block-Based Content Architecture**:

1. **Component-Driven Page Builder:**
   Landing pages are composed of standardized JSON-schema content blocks:
   - `HeroBannerBlock` (title, subtitle, CTA button, background image/video, badge)
   - `FeaturedCategoryGridBlock` (image cards linking to outdoor gear collections)
   - `CuratedProductCarouselBlock` (dynamic link to catalog SKUs or category tags)
   - `StoryEditorialBlock` (outdoor photography + rich text storytelling)
   - `FeatureHighlightsBlock` (icons, bullet features e.g. "Lifetime Gear Warranty")
   - `FaqAccordionBlock` (collapsible Q&A for campaign-specific guidance)

2. **Scheduling Engine:**
   - Landing pages support `publish_at` and `unpublish_at` timestamps.
   - The Storefront Next.js ISR fetches published pages via `/api/v1/storefront/landings/{slug}`.

3. **Content Delivery Port:**
   - A dedicated `ContentDeliveryPort` provides page layouts to the storefront. Initial implementation stores layout definitions in PostgreSQL `cms.landing_pages` and `cms.content_blocks`, with webhook support for external headless CMS ingestion if adopted.

## Consequences

### Positive
- Marketing can launch campaigns independently in minutes.
- Strict design system prevents brand degradation.
- Zero impact on backend core e-commerce transaction performance.

### Negative
- Requires building a reusable UI block registry in the Next.js frontend during initial sprints.
