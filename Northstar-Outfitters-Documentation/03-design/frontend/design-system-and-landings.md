# Design System & Landing Page Specifications

**Brand:** Northstar Outfitters  
**Domain:** Outdoor, Recreational & Mountaineering Retail  
**Design Baseline:** September 2026  
**Status:** DRAFT — FOR ARCHITECTURE REVIEW

---

## 1. Brand Identity & Aesthetic Direction

Northstar Outfitters caters to hikers, campers, mountaineers, trail runners, and outdoor explorers. The visual design system blends **rugged outdoor authenticity** with **modern, premium minimalism**.

- **Visual Feel:** High-contrast photography, spacious editorial layouts, crisp typography, and functional utility.
- **Micro-Interactions:** Subtle hover states, smooth drawer slide-ins, and tactile feedback on cart additions.
- **Accessibility:** Compliance with **WCAG 2.1 Level AA** standards across all colors, contrasts, and interactive components.

---

## 2. Design Tokens & Color Palette

```css
:root {
  /* Brand Primary: Deep Pine / Forest */
  --color-primary-900: #0f2e23;
  --color-primary-800: #1b4d3e;
  --color-primary-600: #2d7a62;
  --color-primary-500: #3b9b7d;

  /* Accent: Ember Orange / Mountain Sunrise */
  --color-accent-600: #c25e1a;
  --color-accent-500: #e06d20;
  --color-accent-400: #f48d42;

  /* Neutrals: Granite, Slate & Snow */
  --color-neutral-900: #121516; /* Deep Granite (Dark text/headings) */
  --color-neutral-700: #3a4043; /* Muted Slate */
  --color-neutral-300: #d1d5db; /* Border & divider lines */
  --color-neutral-100: #f3f4f6; /* Subtle card backgrounds */
  --color-neutral-50:  #f9fafb; /* Snow off-white page background */

  /* Semantic Feedback */
  --color-success: #15803d; /* In Stock / Order Complete */
  --color-warning: #b45309; /* Low Stock (< 3 remaining) */
  --color-danger:  #b91c1c; /* Payment Error / Out of Stock */

  /* Typography */
  --font-heading: 'Outfit', sans-serif;
  --font-body:    'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
}
```

---

## 3. Responsive Breakpoints & Layout Grid

Mobile-first responsive layout utilizing Tailwind CSS standard grid:

| Breakpoint | Viewport Width | Target Devices | Design Consideration |
| :--- | :--- | :--- | :--- |
| **sm** | `640px` | Small tablets, large smartphones | Single-column landings, sticky bottom checkout bar. |
| **md** | `768px` | Tablets portrait | 2-column product grids, collapsible filter drawers. |
| **lg** | `1024px` | Laptops / Desktops | 3-column product cards, expanded sticky filter sidebar. |
| **xl** | `1280px` | Widescreen Displays | 4-column product grids, full editorial split showcases. |
| **2xl** | `1536px` | Ultra-wide monitors | Content max-width constrained to `1440px` with margin centering. |

---

## 4. Dynamic Landing Page Component Catalog

Marketing teams compose campaign landings (e.g. `Winter Summit 2026`, `Ultralight Backpacking Guide`) using standardized, responsive component blocks.

### Block 1: Hero Banner Block (`hero_banner`)
- **Visuals:** Full-bleed background image or muted looping MP4 video of outdoor terrain with a dark gradient overlay.
- **Elements:**
  - Eyebrow tag: (e.g., `NEW SEASON ARRIVALS`)
  - Headline: (e.g., `Engineered for the Unforgiving Cold`)
  - Subhead: (e.g., `Discover sub-zero technical sleeping bags, 4-season tents, and mountaineering crampons.`)
  - CTA Buttons: Primary (`Shop The Collection`) + Secondary (`Watch Field Test`).

### Block 2: Featured Category Grid (`category_grid`)
- **Layout:** Responsive 2x2 or 3-column masonry grid.
- **Card Elements:** Aspect ratio 4:5 image cards, subtle hover zoom effect, high-contrast overlay text (`Tents & Shelters`, `Alpine Packs`, `Trail Footwear`).

### Block 3: Curated Equipment Carousel (`product_carousel`)
- **Layout:** Horizontal scroll on mobile with touch snapping; 4-item carousel with navigation arrows on desktop.
- **Card Elements:**
  - Product thumbnail with hover secondary angle image.
  - Category / Brand badge.
  - Title and pricing (current price + slashed original MSRP if on sale).
  - **Stock Status Badge:**
    - Green: `In Stock`
    - Amber: `Only 2 Left` (real-time reservation threshold)
    - Gray: `Out of Stock`
  - Quick "Add to Bag" action.

### Block 4: Editorial & Storytelling Split (`story_split`)
- **Layout:** 50/50 split on desktop, stacked on mobile.
- **Content:** Left side: High-resolution field photography. Right side: Editorial narrative, brand ambassador quote, sustainability pledge ("1% for the Planet"), and shop-the-look hotspot pins.

### Block 5: Technical Feature Highlights (`feature_grid`)
- **Layout:** 3 or 4 icon columns highlighting brand guarantees:
  - 🛡️ *Lifetime Warranty on Technical Packs*
  - 🚚 *Free Expedited Shipping over $99*
  - 🔄 *Hassle-Free 30-Day Returns*
  - 🏔️ *Expert Field Support*

### Block 6: Campaign FAQ Accordion (`faq_accordion`)
- **Layout:** Clean collapsible accordion with keyboard accessibility (`Enter`/`Space` expansion).
- **Purpose:** Answering campaign-specific sizing, temperature ratings, shipping split policies, or warranty details.

---

## 5. Accessibility & Mobile Optimization Checklist

- [ ] All interactive buttons and touch targets meet minimum `44x44px` tappable dimensions on mobile screens.
- [ ] Color contrast ratios between text and background exceed `4.5:1` for body copy and `3:0:1` for large headlines.
- [ ] All promotional images have mandatory descriptive `alt` attributes entered via the CMS.
- [ ] Screen reader announcements for cart additions via `aria-live="polite"` regions.
- [ ] Keyboard focus rings are clearly visible on all clickable links, buttons, and form inputs.
