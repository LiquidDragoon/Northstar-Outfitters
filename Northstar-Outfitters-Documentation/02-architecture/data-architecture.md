# Data Architecture

**Version:** 2.0  
**Status:** Architecture Baseline

## 1. Database & Schema Strategy

Northstar Outfitters utilizes **PostgreSQL** hosted on Amazon RDS (Multi-AZ in production) as the primary relational system of record, supplemented by **ElastiCache (Redis)** for low-latency session and hot catalog caching.

To strictly enforce modular boundaries while maintaining single-database operational simplicity, the database is partitioned into **PostgreSQL Schemas**:

```text
northstar_db
├── catalog.*      (products, categories, skus, media)
├── inventory.*    (positions, reservations, sync_audit)
├── orders.*       (orders, order_lines, totals)
├── payments.*     (transactions, attempts, idempotency_keys, refunds)
├── fulfillment.*  (groups, dispatches, tracking_records)
├── returns.*      (return_requests, refund_orders)
├── customer.*     (accounts, credentials, addresses)
├── cart.*         (active_carts, cart_items)
├── cms.*          (landing_pages, content_blocks, campaigns)
└── technical.*    (outbox_events, audit_logs, shedlock)
```

## 2. Cross-Schema Ownership & Data Isolation

- **Zero Cross-Schema SQL Joins:** Application queries are strictly scoped to the owning module's schema. Writing SQL `JOIN` across different business schemas is prohibited by policy and automated static query linting.
- **Foreign Keys:** Physical foreign keys exist *only within the same schema*. Cross-module relationships are maintained via logical identifiers (e.g. `order.customer_id` stores a UUID, not a database foreign key to `customer.accounts`).

## 3. High-Performance Caching (Redis)

ElastiCache Redis is deployed for:
1. **Sellable Inventory Read-Cache:** Fast check for `sellable_quantity` on high-traffic product listings, invalidated immediately upon inventory commits or ERP sync updates.
2. **Guest & Customer Carts:** Fast session store with 30-day TTL for anonymous browsing.
3. **CMS Landing Pages & Navigation Menu:** Cached serialized JSON representations of promotional landing layouts.

## 4. Concurrency & Over-Allocation Prevention

Stock reservation during checkout (`FR-INV-002`) requires bulletproof concurrency control to prevent overselling during flash sales. Two complementary patterns are enforced:

### Atomic Decrement Pattern
```sql
UPDATE inventory.positions
SET reserved_quantity = reserved_quantity + :qty,
    version = version + 1,
    updated_at = NOW()
WHERE sku = :sku
  AND (sellable_quantity - reserved_quantity) >= :qty;
```
If the rows affected is `0`, the SKU is out of stock, preventing race conditions without blocking concurrent reads.

### Pessimistic Row Lock (High Contention Alternative)
```sql
SELECT sku, sellable_quantity, reserved_quantity
FROM inventory.positions
WHERE sku = :sku
FOR UPDATE;
```

## 5. Transactional Outbox Pattern

To ensure reliable, at-least-once asynchronous domain event publication without distributed two-phase commits, every business transaction that produces domain events writes to a dedicated `technical.outbox_events` table within the same ACID database transaction:

```sql
CREATE TABLE technical.outbox_events (
    id UUID PRIMARY KEY,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_outbox_pending ON technical.outbox_events (status, created_at)
WHERE status = 'PENDING';
```

A scheduled worker polls pending events using `SELECT ... FOR UPDATE SKIP LOCKED` and publishes them to the internal event bus or external message queues (AWS SQS/SNS), marking `processed_at = NOW()`.

## 6. Migration & Schema Versioning

- **Tool:** Flyway is used for all schema evolutions.
- **Discipline:** Migrations are organized by schema folder: `src/main/resources/db/migration/V1__catalog.sql`, `V2__inventory.sql`, etc.
- **Backward Compatibility:** Schema migrations must follow the Expand/Contract (Parallel Run) pattern so rolling ECS deployments never fail against active database connections.
