# Domain Model Specification

**Version:** 2.0  
**Pattern:** Lightweight Domain-Driven Design (DDD) & Hexagonal Architecture  
**Status:** DRAFT — FOR ARCHITECTURE REVIEW

---

## 1. Domain Modeling Principles

- **Rich Behavioral Models:** Domain entities protect their invariants and encapsulate business logic. Anemic data models with indiscriminate public setters are prohibited.
- **Persistence Ignorance:** Domain classes contain zero JPA annotations (`@Entity`, `@Table`), Spring annotations (`@Component`), or third-party serialization tags.
- **Value Objects:** Primitive obsession is avoided by using immutable value objects (`Sku`, `Money`, `Quantity`, `EmailAddress`, `IdempotencyKey`).
- **Aggregate Boundaries:** An aggregate root is the single point of entry for state modifications. Outside modules reference aggregates only by identity.

---

## 2. Core Aggregates & Invariants

### A. Order Aggregate (`orders.domain.model.Order`)
- **Root:** `Order`
- **Entities & Value Objects:** `OrderLine`, `OrderId`, `OrderNumber`, `Money`, `Address`, `OrderStatus`
- **Invariants:**
  1. Once created, purchase prices and tax calculations are strictly immutable (`BR-ORD-001`).
  2. Order can only transition through allowed states:
     `PENDING_PAYMENT → PAID → PROCESSING → SHIPPED → DELIVERED`
  3. Customer self-cancellation is valid *only* in `PENDING_PAYMENT` or `PAID` states (`BR-REF-001`).
  4. Partial cancellation recalculates line-item balances and prorates discounts (`BR-ORD-003`).

### B. Inventory Position Aggregate (`inventory.domain.model.InventoryPosition`)
- **Root:** `InventoryPosition`
- **Entities & Value Objects:** `Sku`, `Quantity`, `ReservationId`, `ReservationStatus`
- **Invariants:**
  1. `sellable_quantity` cannot drop below zero (`AC-INV-001.1`).
  2. Available stock = `sellable_quantity - reserved_quantity`.
  3. Pessimistic conflict rule: When ERP emits an update, `sellable_quantity` is set to `min(local_stock, erp_stock)` (`BR-INV-001`).
  4. Reservations expire after 15 minutes unless an active payment hold flag is set (`BR-INV-002`, `AC-INV-002.1`).

### C. Payment Transaction Aggregate (`payments.domain.model.PaymentTransaction`)
- **Root:** `PaymentTransaction`
- **Entities & Value Objects:** `TransactionId`, `OrderId`, `IdempotencyKey`, `PaymentStatus`, `Money`
- **Invariants:**
  1. Idempotency key (`Order_ID + Attempt_UUID`) must be unique across all attempts (`BR-PAY-001`).
  2. Total refunded amount across all refunds must never exceed original captured amount (`AC-REF-002.2`).
  3. Webhook transition to `PAID` requires cryptographic signature verification (`BR-ORD-002`).

### D. Landing Page Aggregate (`cms.domain.model.LandingPage`)
- **Root:** `LandingPage`
- **Entities & Value Objects:** `LandingPageId`, `Slug`, `ContentBlock`, `PublishWindow`
- **Invariants:**
  1. `slug` must be URL-safe and unique.
  2. A page is publicly accessible only if `is_published == true` AND `NOW() BETWEEN publish_at AND unpublish_at`.
  3. Every content block must conform to its validated JSON schema.

---

## 3. Domain Events Catalog

All significant domain state transitions emit immutable Domain Events published via the Transactional Outbox:

| Event Name | Producing Module | Payload Summary | Downstream Consumers / Reactions |
| :--- | :--- | :--- | :--- |
| `OrderPlacedEvent` | `orders` | `orderId`, `orderNumber`, `items[]`, `total` | `inventory` (reserves stock for 15m), `payments` (creates intent). |
| `InventoryReservedEvent` | `inventory` | `reservationId`, `orderId`, `expiresAt` | `checkout` (confirms reservation hold to frontend). |
| `PaymentSucceededEvent` | `payments` | `orderId`, `providerRef`, `amount` | `orders` (transitions to `PAID`), `inventory` (commits reservation). |
| `PaymentFailedEvent` | `payments` | `orderId`, `reason`, `attemptUuid` | `orders` (records attempt failure), `inventory` (releases reserved stock). |
| `InventoryAllocationFailedEvent`| `inventory` | `orderId`, `reason` | `payments` (**Triggers FR-INV-003 automated refund compensation**). |
| `OrderCompensatedRefundEvent` | `payments` | `orderId`, `refundId`, `amount` | `orders` (transitions to `CANCELLED_REFUNDED`), `notifications` (customer email). |
| `ReservationExpiredEvent` | `inventory` | `reservationId`, `orderId`, `sku` | `inventory` (returns units to available pool). |
| `FulfillmentGroupDispatchedEvent`| `fulfillment`| `orderId`, `groupId`, `trackingNumber`, `carrier` | `orders` (updates shipment status), `notifications` (sends incremental tracking email). |
| `LandingPagePublishedEvent` | `cms` | `pageId`, `slug`, `publishedAt` | `storefront` (triggers Next.js on-demand ISR cache purge for `/landings/{slug}`). |

