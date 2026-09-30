# ADR-004 — Relational Persistence with PostgreSQL Schemas

**Status:** Accepted  
**Date:** September 2026  
**Deciders:** Lead Solutions Architect, Database Engineer  

## Context

The Northstar Outfitters platform requires strong transactional guarantees (ACID) for checkout, payments, inventory reservation, and financial auditing. We need a persistence strategy that prevents module coupling while avoiding the cost and latency of maintaining separate physical databases for each module.

## Decision Drivers

- **Transactional Consistency:** Atomic commitments for orders, reservations, and payment states.
- **Data Isolation:** Enforcing the modular monolith rule that prevents one module from querying another module's tables.
- **Operational Simplicity:** Single managed database instance (Amazon RDS PostgreSQL Multi-AZ) with automated backups and read-replicas.
- **Concurrency Control:** Atomic stock reservations during traffic surges.

## Considered Options

1. **MySQL / MariaDB:** Capable, but PostgreSQL offers superior JSONB handling, schema partitioning, and row-level locking semantics (`SKIP LOCKED`).
2. **MongoDB / DocumentDB:** Weaker transactional models across business boundaries; prone to data inconsistencies during inventory allocation.
3. **Database-Per-Module (Multiple RDS Instances):** Excellent physical isolation, but dramatically increases cloud cost and operational complexity without justification for a single-deployable application.
4. **PostgreSQL with Logical Schemas (Selected):** A single database instance divided into PostgreSQL schemas (`catalog`, `inventory`, `orders`, etc.).

## Decision

We select **PostgreSQL 16+ on Amazon RDS** using **PostgreSQL Schemas for Logical Domain Partitioning**:

1. **Schema Separation:** Each module owns its dedicated schema. Cross-schema foreign keys and cross-schema SQL joins are strictly forbidden.
2. **Connection Pooling:** HikariCP configured with sizing appropriate for ECS task auto-scaling.
3. **Migration Management:** Flyway manages versioned SQL scripts. Migrations run automatically during deployment pipelines before application container startup.
4. **Concurrency Handling:** Inventory reservations leverage atomic conditional updates (`UPDATE ... WHERE sellable_quantity >= :qty`) and `SELECT ... FOR UPDATE` row locks to prevent overselling.

## Consequences

### Positive
- Strict data boundaries aligned with Hexagonal Architecture.
- Zero risk of table namespace collisions.
- Simple operational model with single backup/restore point.
- Easy future extraction: Dumping a single schema (`pg_dump -n inventory`) allows clean extraction to a standalone database if needed.

### Negative
- Requires discipline in JPA/Flyway configuration to target specific schemas (`currentSchema=orders`).
- Complex reporting queries that need data across multiple domains must be handled via application use cases or read-optimized analytical views.
