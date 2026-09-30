# Architecture Overview

**Version:** 1.0 DRAFT

## 1. Target architectural style

The solution is architected as a **Headless E-Commerce Platform**:
1. **Frontend / Presentation Tier:** A modern, server-rendered web application (Next.js / React) optimized for outdoor gear visual storytelling, marketing landing pages, SEO, and sub-second Core Web Vitals.
2. **Backend Core:** A **Modular Monolith using Hexagonal Architecture (Ports and Adapters)** in Java (Spring Boot) and PostgreSQL.
3. **Edge & Caching:** Amazon CloudFront CDN with AWS WAF, coupled with ElastiCache (Redis) for fast session handling, cart persistence, and inventory hot-spot lookups.

This architecture achieves clear separation of concerns, high frontend agility for marketing campaigns, and rock-solid domain isolation without introducing distributed microservices complexity prematurely.

## 2. Logical structure

```text
       [ Public Customers ]              [ Marketing & Store Admins ]
                │                                     │
                ▼                                     ▼
        Amazon CloudFront                     Admin Portal (SPA)
        (Edge CDN / WAF)                              │
                │                                     │
                ▼                                     │
     Storefront Application                           │
     (Next.js SSR/SSG Landings)                       │
                │                                     │
                └───────────────┬─────────────────────┘
                                │ HTTPS / REST / Webhooks
                                ▼
                    +───────────────────────+
                    |  Application API Host |
                    +───────────────────────+
                                │
   ┌───────────┬────────────┬───┴────────┬────────────┬───────────┐
   │           │            │            │            │           │
[Catalog]  [Inventory]   [Orders]    [Payments]  [Fulfillment] [Returns]
   │           │            │            │            │           │
   └───────────┴────────────┴───┬────────┴────────────┴───────────┘
                                │
               +────────────────┴────────────────+
               │ Shared Technical Infrastructure │
               +────────────────┬────────────────+
                                │
       ┌────────────────────────┼────────────────────────┐
       ▼                        ▼                        ▼
ElastiCache (Redis)    PostgreSQL Database       Transactional Outbox
- Hot catalog cache    (Logically Partitioned    - Reliable asynchronous
- Cart sessions         by Module Schemas:         domain event dispatch
- Reservation TTL       orders.*, inventory.*,
                        payments.*, catalog.*)
                                │
                        External Adapters
                 ┌──────────────┼──────────────┐
                 ▼              ▼              ▼
             ERP System      Payment        Logistics
            (Sync Stock)     Gateway         Carriers
```

The component diagram reflects the complete headless deployment model. The storefront and core modular monolith deploy independently while communicating over versioned, contract-tested REST APIs.

## 3. Hexagonal structure per module

```text
module
├── domain
│   ├── model
│   ├── service
│   └── event
├── application
│   ├── port
│   │   ├── in
│   │   └── out
│   └── service
└── adapter
    ├── in
    │   └── web
    └── out
        ├── persistence
        ├── messaging
        └── external
```

## 4. Domain dependency rule

```text
Adapters → Application → Domain
```

The dependency direction must never be reversed.

## 5. Synchronous vs asynchronous

Synchronous interactions are appropriate for:

- customer/API requests,
- administrative operations,
- queries requiring immediate response.

Asynchronous processing is appropriate for:

- payment webhooks,
- inventory synchronization,
- notification dispatch,
- retryable external operations,
- selected domain events.

## 6. Transaction boundaries

A transaction should represent a business consistency boundary.

Examples:

- creating a reservation,
- changing an order state,
- recording a payment result,
- recording a refund request.

Distributed transactions across external systems are avoided.

## 7. Failure handling

External calls require:

- timeout,
- retry policy where safe,
- idempotency,
- correlation ID,
- structured error classification,
- operational alerting where required.

## 8. Future service extraction

Potential future service candidates may include Payments, Inventory or Fulfillment, but extraction is not part of the initial architecture unless justified by discovery and operational evidence.

## 9. Explicit non-goals

The initial design does not assume:

- Kubernetes,
- service mesh,
- Kafka,
- database-per-service,
- event sourcing,
- CQRS,
- distributed transactions.

Each may be introduced later if a documented requirement justifies it.
