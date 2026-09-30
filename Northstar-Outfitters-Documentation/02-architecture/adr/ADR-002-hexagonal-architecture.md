# ADR-002 — Hexagonal Architecture

**Status:** Proposed

## Decision

Use Hexagonal Architecture within each business module.

## Rationale

Business rules should remain independent from:

- web frameworks,
- databases,
- payment providers,
- messaging infrastructure,
- AWS services.

Ports define application/domain-facing contracts. Adapters implement external concerns.

## Consequence

The architecture requires more interfaces and explicit boundaries than a simple CRUD structure. This is intentional, but interfaces should only exist where they represent a meaningful boundary.
