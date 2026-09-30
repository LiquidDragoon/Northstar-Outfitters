# Database Schema Design Specification

**Version:** 2.0  
**Database Engine:** PostgreSQL 16+ (Amazon RDS)  
**Status:** DRAFT — FOR ARCHITECTURE REVIEW

---

## 1. Schema Layout & Logical Partitioning

The database is partitioned into distinct schemas representing business bounded contexts:

```sql
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS fulfillment;
CREATE SCHEMA IF NOT EXISTS returns;
CREATE SCHEMA IF NOT EXISTS customer;
CREATE SCHEMA IF NOT EXISTS cart;
CREATE SCHEMA IF NOT EXISTS cms;
CREATE SCHEMA IF NOT EXISTS technical;
```

---

## 2. Core Tables by Schema

### A. Catalog Schema (`catalog`)
```sql
CREATE TABLE catalog.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(128) NOT NULL,
    category_id UUID NOT NULL,
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE catalog.skus (
    sku VARCHAR(64) PRIMARY KEY, -- e.g. 'NSO-ALP-TENT-4P-OR'
    product_id UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    color VARCHAR(64),
    size VARCHAR(32),
    weight_grams INT,
    price_cents BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT true
);
```

### B. Inventory Schema (`inventory`)
```sql
CREATE TABLE inventory.positions (
    sku VARCHAR(64) PRIMARY KEY,
    sellable_quantity INT NOT NULL CHECK (sellable_quantity >= 0),
    reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    erp_reported_quantity INT NOT NULL DEFAULT 0,
    last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE inventory.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    sku VARCHAR(64) NOT NULL REFERENCES inventory.positions(sku),
    quantity INT NOT NULL CHECK (quantity > 0),
    status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, COMMITTED, EXPIRED, RELEASED
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_reservations_active_expiry 
ON inventory.reservations (status, expires_at) 
WHERE status = 'ACTIVE';
```

### C. Orders Schema (`orders`)
```sql
CREATE TABLE orders.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(32) UNIQUE NOT NULL, -- e.g. 'NSO-2026-10492'
    customer_id UUID,                         -- NULL for anonymous/guest checkout
    customer_email VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING_PAYMENT',
    -- States: PENDING_PAYMENT, PAID, PROCESSING, PARTIALLY_SHIPPED, SHIPPED, DELIVERED, CANCELLED_REFUNDED
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    subtotal_cents BIGINT NOT NULL,
    tax_cents BIGINT NOT NULL,
    shipping_cents BIGINT NOT NULL,
    discount_cents BIGINT NOT NULL DEFAULT 0,
    total_cents BIGINT NOT NULL,
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE orders.order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders.orders(id) ON DELETE CASCADE,
    sku VARCHAR(64) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price_cents BIGINT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    line_total_cents BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING'
    -- Line States: PENDING, COMMITTED, FULFILLED, CANCELLED_REFUNDED
);
```

### D. Payments Schema (`payments`)
```sql
CREATE TABLE payments.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    provider VARCHAR(32) NOT NULL, -- e.g. 'STRIPE', 'ADYEN'
    provider_transaction_id VARCHAR(128),
    amount_cents BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(32) NOT NULL, -- AUTHORIZED, CAPTURED, FAILED, REFUNDED, PARTIALLY_REFUNDED
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE payments.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES payments.transactions(id),
    order_id UUID NOT NULL,
    amount_cents BIGINT NOT NULL,
    reason VARCHAR(128) NOT NULL,
    admin_user_id VARCHAR(64),
    provider_refund_id VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### E. Marketing Landings & Content Schema (`cms`)
```sql
CREATE TABLE cms.landing_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(128) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    meta_description TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    publish_at TIMESTAMP WITH TIME ZONE,
    unpublish_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE cms.content_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landing_page_id UUID NOT NULL REFERENCES cms.landing_pages(id) ON DELETE CASCADE,
    block_type VARCHAR(64) NOT NULL, -- 'hero_banner', 'category_grid', 'product_carousel', 'story_split'
    display_order INT NOT NULL,
    config_payload JSONB NOT NULL
);

CREATE INDEX idx_cms_blocks_order ON cms.content_blocks(landing_page_id, display_order);
```

### F. Technical & Outbox Schema (`technical`)
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

CREATE TABLE technical.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    target_entity VARCHAR(64) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    payload_before JSONB,
    payload_after JSONB,
    correlation_id VARCHAR(64),
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

---

## 3. High-Concurrency Stock Reservation Query Pattern

When reserving inventory during checkout submit (`FR-INV-002`):

```sql
-- Executed inside an ACID transaction:
UPDATE inventory.positions
SET reserved_quantity = reserved_quantity + :qty,
    version = version + 1
WHERE sku = :sku
  AND (sellable_quantity - reserved_quantity) >= :qty;

-- If rows affected == 1:
INSERT INTO inventory.reservations (order_id, sku, quantity, status, expires_at)
VALUES (:orderId, :sku, :qty, 'ACTIVE', NOW() + INTERVAL '15 minutes');
```
If rows affected is `0`, the use-case raises an `InsufficientStockException` and immediately terminates the transaction.

