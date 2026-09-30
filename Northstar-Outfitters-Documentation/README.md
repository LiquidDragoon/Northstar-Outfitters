# Northstar Outfitters — Platform Re-Engineering Documentation Pack

**Project:** E-Commerce Platform Modernization (Greenfield Re-Platforming)  
**RFP Reference:** NSO-ECOM-2026-01  
**Documentation Baseline:** September 2026  
**Status:** DRAFT — FOR ARCHITECTURE REVIEW

---

## 1. Project Purpose & Scope

This documentation pack defines the architecture, technical design, frontend experience, and operational foundations for the **new Northstar Outfitters e-commerce application**. 

Although Northstar currently operates a legacy online store, this project is built as a **totally new, clean-slate application (re-platforming)** designed around proven business rules and modernized for high-converting marketing campaigns, sub-second performance, and seamless omnichannel fulfillment.

---

## 2. Proposed Architecture Baseline

- **Headless Storefront & Landings:** Next.js (App Router, React 19+, TypeScript, Tailwind CSS) with Hybrid SSR/ISR rendering for sub-second Core Web Vitals and dynamic campaign landings.
- **Backend Architecture:** Modular Monolith using Hexagonal Architecture (Ports and Adapters) in Java 21 / Spring Boot 3.
- **Persistence & Caching:** Amazon RDS PostgreSQL 16 (logically partitioned by domain schemas) + Amazon ElastiCache (Redis) for cart sessions, reservation TTLs, and hot catalog lookups.
- **Reliability & Integration:** Transactional Outbox pattern with `SKIP LOCKED` polling; cryptographic webhook validation; deterministic idempotency keys.
- **Hosting & Infrastructure:** 100% Terraform Infrastructure as Code (IaC) on AWS (ECS Fargate in private subnets, Amazon CloudFront CDN, AWS WAF).
- **CI/CD & Verification:** GitLab CI/CD with ArchUnit architectural boundary enforcement, Testcontainers, and Playwright E2E suites.

---

## 3. Complete Documentation Structure

```text
├── 01-business/
│   ├── rfp.md                               # Original Request for Proposal
│   ├── discovery-plan.md                    # Domain discovery, schema mapping & interview schedule
│   ├── functional-requirements.md           # FRS: Core business rules, state machines & acceptance criteria
│   └── cutover-and-migration-strategy.md   # Data migration, password re-hashing & zero-downtime cutover
├── 02-architecture/
│   ├── architecture-overview.md             # Full-stack system topology & component diagram
│   ├── architecture-principles.md          # Architectural principles & quality attributes
│   ├── context-map.md                       # Bounded contexts & module ownership
│   ├── data-architecture.md                 # PostgreSQL schemas, Redis caching & concurrency locking
│   └── adr/                                 # Architectural Decision Records (ADR-001 to ADR-010)
│       ├── ADR-001-application-architecture.md
│       ├── ADR-002-hexagonal-architecture.md
│       ├── ADR-003-modular-boundaries.md
│       ├── ADR-004-database.md
│       ├── ADR-005-authentication.md
│       ├── ADR-006-payment-integration.md
│       ├── ADR-007-messaging.md
│       ├── ADR-008-aws-deployment.md
│       ├── ADR-009-frontend-storefront-architecture.md
│       └── ADR-010-landing-pages-and-content-management.md
├── 03-design/
│   ├── api/api-design.md                    # Storefront, Admin & Webhook REST API contracts (RFC 7807)
│   ├── database/database-design.md          # DDL schemas, table structures, and concurrency patterns
│   ├── domain-model/README.md               # Aggregates, invariants & complete Domain Events catalog
│   ├── frontend/
│   │   ├── frontend-architecture.md         # Next.js App Router, SSR/ISR, and state management
│   │   └── design-system-and-landings.md    # Brand design tokens, responsive grid & landing block catalog
│   └── integration/integration-design.md    # Mermaid sequence flows (Webhooks, compensation, ERP sync)
├── 04-development/
│   ├── coding-standards.md                  # Java, Spring & TypeScript coding conventions
│   ├── definition-of-done.md                # Quality gates & feature completion checklist
│   ├── development-guidelines.md            # Branching, commits & PR reviews
│   └── testing-strategy.md                  # Test pyramid, ArchUnit, Testcontainers & Playwright
├── 05-devops/
│   ├── aws-architecture.md                  # Cloud topology, ECS Fargate, CloudFront, Terraform
│   ├── ci-cd.md                             # GitLab CI/CD multi-stage pipeline
│   ├── deployment-strategy.md               # Rolling deployment & database migration discipline
│   └── environments.md                      # Dev, QA, Staging, and Production specifications
└── 06-operations/
    ├── incident-management.md               # Incident severity levels (SEV-1 to SEV-3)
    ├── observability.md                     # Structured logs, metrics, correlation IDs & alerts
    └── support-runbook.md                   # Operational runbooks (webhooks, refund failure, stock drift)
```

---

## 4. Suggested Review Order

1. **[01-business/functional-requirements.md](01-business/functional-requirements.md)** — Core business rules, state machines, and cart/checkout invariants.
2. **[01-business/cutover-and-migration-strategy.md](01-business/cutover-and-migration-strategy.md)** — Legacy data migration & cutover runout plan.
3. **[02-architecture/architecture-overview.md](02-architecture/architecture-overview.md)** & **[02-architecture/adr/](02-architecture/adr/)** — Architecture baseline and ADRs 001–010.
4. **[03-design/frontend/frontend-architecture.md](03-design/frontend/frontend-architecture.md)** & **[03-design/frontend/design-system-and-landings.md](03-design/frontend/design-system-and-landings.md)** — Frontend tech stack, brand aesthetics, and dynamic landing page builder.
5. **[03-design/api/api-design.md](03-design/api/api-design.md)** & **[03-design/database/database-design.md](03-design/database/database-design.md)** — API contracts, PostgreSQL schemas, and concurrency locks.
6. **[03-design/integration/integration-design.md](03-design/integration/integration-design.md)** — Payment webhook, compensation, and ERP sequence diagrams.
7. **[04-development/testing-strategy.md](04-development/testing-strategy.md)** & **[05-devops/aws-architecture.md](05-devops/aws-architecture.md)** — Testing automation and Terraform AWS deployment.

