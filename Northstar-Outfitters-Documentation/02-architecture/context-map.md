# Context Map

**Version:** 1.0 DRAFT

## 1. Purpose

Define the major business and technical contexts that interact with the e-commerce platform.

## 2. Proposed bounded contexts

### Catalog

Owns:

- product information,
- SKU identity,
- pricing presentation,
- product availability presentation,
- catalog administration.

Does not own:

- authoritative ERP inventory,
- payment state,
- fulfillment execution.

### Inventory

Owns:

- sellable quantity,
- inventory synchronization,
- reservations,
- reservation expiration,
- allocation,
- inventory compensation triggers.

Important rule from FRS:

Sellable inventory uses the pessimistic/lower quantity between local and ERP stock.

### Orders

Owns:

- order aggregate,
- order lifecycle,
- immutable purchase values,
- line-item state,
- order totals,
- order state transitions.

### Payments

Owns:

- payment attempts,
- provider abstraction,
- idempotency,
- payment status,
- refunds,
- provider capability validation.

### Fulfillment

Owns:

- fulfillment groups,
- allocation by location,
- dispatch,
- tracking numbers,
- fulfillment state.

### Returns & Refunds

Owns:

- cancellation eligibility,
- return eligibility,
- refund orchestration,
- refund reasons,
- refund audit trail.

### Customer Identity & Profile

Owns:

- customer credentials and password migration flags,
- saved shipping & billing address books,
- customer contact details,
- GDPR/privacy deletion flags.

### Shopping Cart

Owns:

- active shopping carts (guest session and registered user),
- guest-to-customer cart merge logic,
- cart line-items and quantities,
- price/stock revalidation at checkout entry.

### Marketing Content & Landing Pages (CMS)

Owns:

- dynamic landing page layouts (Hero banners, category grids, storytelling),
- scheduled promotional campaigns and banners,
- outdoor adventure editorial content,
- SEO page metadata and Schema.org structured data.

### Administration

Owns:

- administrative roles,
- permissions,
- access to operational capabilities,
- audit requirements around privileged operations.

## 3. External contexts

Likely external systems:

- ERP
- payment gateway/provider
- logistics/shipping provider
- CRM/customer system
- email/notification provider
- identity provider, if external authentication is retained

## 4. Relationship direction

The e-commerce platform should not allow external systems to determine its internal domain model.

External models are translated at adapters/anti-corruption boundaries.

## 5. Important integration relationships

ERP → Inventory synchronization

Payment Provider → Payment webhook

E-commerce → Payment Provider

E-commerce → Logistics

E-commerce → Notification provider

Administrative UI → Application use cases

## 6. Boundary rule

No module may directly use another module's persistence entities or repositories.

Cross-module communication must use one of:

- explicit application contracts,
- domain/application events,
- stable interfaces,
- documented queries/commands.

## 7. Pending validation

This context map is provisional until discovery confirms the actual responsibilities of the existing ERP, CRM, inventory and logistics systems.
