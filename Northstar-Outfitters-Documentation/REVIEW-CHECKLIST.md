# Architecture Review Checklist

Use this document with engineering leads, product stakeholders, and DevOps before implementation.

## Business & Requirements
- [ ] Are the 9 module boundaries compatible with business operations?
- [ ] Are cart and checkout invariants (TTL hold, guest merging, discount proration) approved?
- [ ] Are dynamic landing page publishing workflows and scheduled campaign windows clear?
- [ ] Are all non-functional requirements (PCI-DSS SAQ A, WCAG 2.1 AA, Lighthouse 90+) realistic?

## Data Migration & Cutover
- [ ] Is the customer credential migration strategy (Argon2id re-hashing vs. secure reset link) signed off?
- [ ] Is the catalog, SKU, and historical order ETL pipeline documented?
- [ ] Is the "drain and runout" cutover schedule approved by operations?
- [ ] Are 301 SEO redirects mapped from legacy URLs to canonical slugs?

## Frontend, UX & Landing Pages
- [ ] Does the Next.js App Router hybrid rendering (ISR for landings/PDPs, CSR for checkout) meet performance goals?
- [ ] Is the design token palette (Deep Pine, Ember Orange, Granite) aligned with brand guidelines?
- [ ] Are the 6 reusable landing page content blocks sufficient for marketing campaigns?
- [ ] Are mobile touch targets (44x44px minimum) and accessibility criteria verified?

## Architecture & Code Quality
- [ ] Does the Modular Monolith with package-private encapsulation simplify the 6-month delivery?
- [ ] Are ArchUnit tests configured to mechanically enforce hexagonal boundaries in CI?
- [ ] Are cross-module interactions strictly using public API contracts and domain events?
- [ ] Are ADRs 001 through 010 reviewed and approved?

## Data & Persistence
- [ ] Are PostgreSQL Schemas (`catalog`, `inventory`, `orders`, `payments`, etc.) properly isolated?
- [ ] Are cross-schema SQL joins prevented?
- [ ] Is the atomic conditional inventory decrement verified for flash-sale concurrency?
- [ ] Is the Transactional Outbox pattern implemented with `SKIP LOCKED` polling?
- [ ] Is ElastiCache Redis appropriately sized for session carts and reservation TTLs?

## Integrations & Resiliency
- [ ] Are payment webhook signature verification and timestamp replay checks specified?
- [ ] Is the automated refund compensation workflow (`FR-INV-003`) tested via sequence diagrams?
- [ ] Is the pessimistic inventory synchronization rule (`min(local, ERP)`) agreed upon?
- [ ] Are external timeouts, retries, and dead-letter queues configured for all external ports?

## Cloud, DevOps & Operations
- [ ] Are all AWS resources (ECS Fargate, RDS Multi-AZ, CloudFront, Redis) codified in Terraform?
- [ ] Are containers running in private subnets with least-privilege IAM task roles?
- [ ] Are Playwright E2E and Testcontainers integration tests integrated into GitLab CI/CD?
- [ ] Are SEV-1 to SEV-3 incident runbooks actionable by customer support and IT staff?

---

## Final Review Decision

- [ ] Approved: Continue to Sprint 0 & Implementation
- [ ] Approved with minor modifications
- [ ] Rework required before coding begins

**Review Notes & Sign-offs:**
> Document team feedback and sign-offs here.

