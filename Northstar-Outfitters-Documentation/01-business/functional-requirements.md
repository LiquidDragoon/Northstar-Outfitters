## FUNCTIONAL REQUIREMENTS SPECIFICATION (FRS)

## Document Reference: FRS-NSO-ECOM-2026-V1

**Project:** Northstar Outfitters — E-Commerce Platform Modernization

## Date: September 2026

## 1. DOMAIN: INVENTORY & SYNCHRONIZATION

## FR-INV-001 — Sellable Inventory Calculation

The system shall calculate the available sellable stock for online purchase using the pessimistic rule between the local inventory state and external ERP updates.

- **BR-INV-001 — Pessimistic Conflict Rule:** When a discrepancy exists between local e-commerce stock and the external ERP stock, the system must adopt the lower quantity as the authoritative Sellable Quantity. An operational alert must be automatically emitted for manual audit.
- **AC-INV-001.1 — Non-Negative Inventory:** The system shall never allow Sellable Quantity to drop below zero (0). Any incoming sync result indicating negative values (e.g., -1) must be rejected, flagged as a Data Error, and logged.
- **AC-INV-001.2 — Out-of-Stock Purchase Prevention:** When Sellable Quantity = 0, the platform must disable the "Add to Cart" and "Checkout" actions for that specific SKU across all customer channels and display "Out of Stock" with an optional back-in-stock notification subscription.

## FR-INV-002 — Inventory Position Lifecycle, Reservation & TTL

The system shall manage inventory positions across deterministic states: `AVAILABLE`, `RESERVED`, and `COMMITTED`.

- **BR-INV-002 — 15-Minute Reservation TTL:** Reserved inventory shall expire automatically after 15 minutes if payment authorization is not completed, returning the units to the `AVAILABLE` pool.
- **BR-INV-003 — Reservation Trigger Point:** Inventory reservation must occur strictly at the moment the customer submits the payment authorization form during checkout, not upon viewing the cart or payment page.
- **AC-INV-002.1 — Active Payment Hold Exemption:** If a payment transaction is actively being processed by a payment gateway (awaiting an asynchronous 3DS or webhook response), the 15-minute TTL expiration must be suspended until a definitive gateway status is received.
- **AC-INV-002.2 — Concurrency Locking:** The inventory service must execute atomic database locks (`SELECT ... FOR UPDATE` or atomic conditional decrement `UPDATE ... WHERE sellable_quantity >= :qty`) during stock reservation to guarantee that simultaneous checkout attempts for the last available unit do not cause over-allocation.
- **AC-INV-002.3 — Transition to Committed:** Upon receipt of a valid `PAID` confirmation from the payment gateway, the reserved stock is transitioned from `RESERVED` to `COMMITTED`.

## FR-INV-003 — Automated Inventory Compensation

The system shall execute automated financial and inventory compensation workflows when payment succeeds but inventory allocation fails (e.g. edge-case race condition during TTL expiration or physical ERP deficit).

- **BR-INV-004 — Automated Refund Preference:** If an order reaches a paid state on the gateway but inventory cannot be committed, the system must automatically initiate a full refund rather than queuing the order for manual review.
- **AC-INV-003.1 — Automated Refund Execution:** Upon inventory allocation failure post-payment, the system shall call the payment provider's refund API, transition the order to `CANCELLED_REFUNDED`, release any partially held stock, and notify the customer.
- **AC-INV-003.2 — High-Priority Incident Fallback:** If the automated refund API call fails or times out during a compensation workflow, the system must immediately raise a High-Priority Operational Incident for manual intervention by Customer Service/Operations.

## 2. DOMAIN: ORDERS & FULFILLMENT

## FR-ORD-001 — Order Creation & State Machine

The system shall manage the complete order lifecycle using a deterministic, event-driven state machine.

- **BR-ORD-001 — Price Immutability:** An order must record and lock the product prices, taxes, and discounts at the exact moment of purchase. Subsequent catalog price modifications shall not alter existing order totals.
- **BR-ORD-002 — Authoritative Webhook Confirmation:** An order shall transition to the `PAID` state exclusively upon receipt and verification of a signed asynchronous webhook/IPN from the payment provider. Synchronous checkout responses shall only be used for UI feedback.
- **AC-ORD-001.1 — Order Lifecycle Transitions:** The system shall enforce the following strict status transitions:
  `PENDING_PAYMENT` => `PAID` => `PROCESSING` => `SHIPPED` => `DELIVERED`.
- **AC-ORD-001.2 — Asynchronous Browser Disconnect Recovery:** If a customer's browser disconnects or times out after payment completion, the backend webhook processor must transition the order to `PAID`, commit the inventory reservation, and dispatch confirmation emails independently of the customer's browser state.

## FR-ORD-002 — Item-Level Partial Cancellation

The system shall support line-item level cancellation and tracking within a single order.

- **BR-ORD-003 — Partial Fulfillment & Refund:** If an individual item within a multi-item order cannot be fulfilled, the system shall allow Operations to cancel that specific line item, adjust the order balance, recalculate taxes, and issue a partial refund for the unavailable item while fulfilling the remainder of the order.
- **AC-ORD-002.1 — Granular Line-Item Statuses:** Each order line item must independently maintain its status (e.g., Item A: `FULFILLED`, Item B: `CANCELLED_REFUNDED`).
- **AC-ORD-002.2 — Partial Capture/Refund Recalculation:** The system shall re-evaluate order totals, applicable taxes, and pro-rated promotion discounts whenever a partial cancellation occurs.

## FR-ORD-003 — Multi-Location Fulfillment (Split Shipments)

The system shall support fulfilling items in a single customer order from multiple physical locations (e.g., Central Warehouse, Store A, Store B).

- **BR-ORD-004 — Single Customer Order / Multiple Tracking:** A multi-location order must present a consolidated view to the customer while generating distinct fulfillment tasks and tracking numbers for each dispatch location.
- **AC-ORD-003.1 — Fulfillment Group Generation:** The system shall partition an order into separate "Fulfillment Groups" based on item stock location.
- **AC-ORD-003.2 — Multi-Carrier Tracking Notification:** The platform shall send incremental shipping notifications to the customer as each individual Fulfillment Group is dispatched, linking multiple tracking numbers to the parent order.

## 3. DOMAIN: PAYMENTS & RECONCILIATION

## FR-PAY-001 — Payment Idempotency & Duplicate Protection

The system shall guarantee that duplicate payment requests for the same order do not result in multiple charges.

- **BR-PAY-001 — Transaction Idempotency:** Every payment request sent to an external provider must include a unique, deterministically generated Idempotency Key (`Order_ID + Attempt_UUID`).
- **AC-PAY-001.1 — Double-Click Prevention:** If a customer submits a payment request multiple times (e.g., double-clicking "Pay" or retrying during a network lag), the system must intercept the duplicate request using the idempotency key and return the original transaction result without re-charging the payment method.

## FR-PAY-002 — Provider Abstraction Layer

The system shall implement an abstraction gateway to normalize feature discrepancies across multiple payment providers.

- **BR-PAY-002 — Provider Capability Mapping:** The system must maintain a feature-capability matrix (e.g., `supports_partial_refund`, `supports_async_capture`) per provider and validate requested operations before execution.
- **AC-PAY-002.1 — Graceful Degradation:** If an administrative user attempts an operation (such as a native partial refund) on a payment provider that does not support it via API, the system must block the action, display a clear explanatory message, and route the workflow to an approved manual procedure.

## 4. DOMAIN: CANCELLATIONS, RETURNS & REFUNDS

## FR-REF-001 — Customer & Operations Cancellation Rules

The system shall enforce role-based and state-dependent cancellation policies.

- **BR-REF-001 — State-Dependent Cancellation Rights:**
  - `PENDING_PAYMENT` / `PAID`: Customer can self-cancel via customer portal.
  - `PROCESSING`: Customer cannot self-cancel; can only submit a Cancellation Request to Customer Service/Operations.
  - `SHIPPED` / `DELIVERED`: Cancellation is strictly prohibited; must follow the Return Process.
- **AC-REF-001.1 — Processing State Interception:** When a cancellation is requested for an order in `PROCESSING`, the system must verify with the fulfillment module whether physical dispatch has occurred before approving the cancellation and releasing inventory.

## FR-REF-002 — Refund Execution & Shipping Fee Rules

The system shall allow authorized staff to initiate full or partial refunds directly from the admin platform according to corporate financial policies.

- **BR-REF-002 — 30-Day Return Window:** Return and refund requests must be submitted within 30 calendar days following the order's `DELIVERED` timestamp.
- **BR-REF-003 — Conditional Shipping Fee Refunds:** Original shipping fees shall be refunded **only** if the return/cancellation is caused by a Northstar error (out of stock, wrong item, damaged goods). Shipping fees shall **not** be refunded for standard customer-initiated returns.
- **AC-REF-002.1 — Admin Refund Audit Trail:** Every refund executed via the admin panel must record: Original Transaction Reference, Refunded Amount, Refund Reason, Initiating Admin User ID, Timestamp, and Provider Response Payload.
- **AC-REF-002.2 — Maximum Refund Constraint:** The system shall block any refund attempt where Total Refunded Amount > Originally Captured Amount.

## 5. DOMAIN: SHOPPING CART & CHECKOUT SESSION

## FR-CRT-001 — Cart Lifecycle & Anonymous Session

The system shall manage active customer carts for both anonymous visitors and authenticated users.

- **BR-CRT-001 — Guest-to-Customer Cart Merging:** When an anonymous guest user signs in or registers, their existing session cart must automatically merge with their persistent customer account cart, updating quantities and current prices.
- **BR-CRT-002 — Price Revalidation at Checkout Entry:** Cart items do not lock prices while browsing. Upon entering the final checkout step, the system must re-validate product prices and active sellable stock.
- **AC-CRT-001.1 — Cart Expiry & Abandonment:** Anonymous carts must expire after 30 days of inactivity. Authenticated customer carts remain saved indefinitely or until checked out/cleared.

## 6. DOMAIN: PRICING, TAXES & SHIPPING CALCULATION

## FR-PRC-001 — Dynamic Tax & Shipping Fee Quotation

The system shall calculate accurate delivery fees and jurisdiction-based sales taxes prior to payment authorization.

- **BR-PRC-001 — Delivery Address Tax Calculation:** Taxes must be calculated based on the verified delivery shipping address (state, county, zip code) adhering to outdoor equipment tax categories.
- **BR-PRC-002 — Split Shipment Shipping Fee Policy:** If an order requires multi-location fulfillment (split shipment), the customer must be billed based on the original single-order shipping rate chosen at checkout; additional carrier dispatch costs are Northstar operational overhead.
- **AC-PRC-001.1 — Promotional Discount Proration:** Order-level discounts (e.g., \$20 off orders over \$100) must be proportionally distributed across individual line items to ensure fair refund calculations during partial returns.

## 7. DOMAIN: CUSTOMER IDENTITY & ACCOUNTS

## FR-CST-001 — Customer Authentication & Self-Service

The platform shall support seamless customer onboarding and profile management.

- **BR-CST-001 — Guest Checkout Support:** Customers must be able to complete a purchase without creating a password. Post-purchase, the customer may convert their guest order into a permanent account with one click.
- **BR-CST-002 — Customer Privacy & PII Protection:** Customers have the right to request account anonymization/deletion. Financial records must be retained for tax/audit compliance (7 years) while personal identifying data is scrubbed.
- **AC-CST-001.1 — Address Book Management:** Customers can save multiple shipping and billing addresses, designating one as default.

## 8. DOMAIN: MARKETING LANDINGS, PROMOTIONS & CONTENT MANAGEMENT

## FR-CMS-001 — Dynamic Landing Pages & Campaign Banners

The platform must provide dynamic landing page capabilities to support seasonal outdoor campaigns, product launches, and brand storytelling.

- **BR-CMS-001 — Modular Page Composition:** Marketing teams must be able to configure promotional landing pages using reusable content components (Hero Banners, Featured Category Grids, Curated Equipment Carousels, Editorial/Story Blocks, and FAQ accordions) without requiring developer code deployments.
- **BR-CMS-002 — Scheduled Campaign Publishing:** Content blocks and landing pages must support scheduled publication windows (start date/time and end date/time) for automated campaign launches (e.g. "Winter Alpine Gear Sale").
- **AC-CMS-001.1 — SEO & Core Web Vitals:** All landing pages must be server-rendered or statically generated with metadata tags (OpenGraph, Schema.org product/collection structured data), achieving a minimum Google Lighthouse Performance score of 90+ and LCP (Largest Contentful Paint) < 2.5s.
- **AC-CMS-001.2 — Responsive Design:** Landings and product visual showcases must be fully responsive, optimized for mobile outdoor enthusiasts, supporting high-resolution responsive imagery with modern formats (AVIF/WebP) and CDN caching.

## 9. DOMAIN: ADMINISTRATION & ROLE-BASED ACCESS CONTROL (RBAC)

## FR-ADM-001 — Role-Based Access Control

The system shall enforce strict Role-Based Access Control (RBAC) across all administrative functions.

- **BR-ADM-001 — Least Privilege Principle:** Users shall only access administrative tools, customer PII, and financial operations explicitly granted by their assigned role.
- **AC-ADM-001.1 — Default Roles:** The system shall provide at minimum five pre-configured roles:
  - **E-Commerce Administrator:** Full access to Catalog, Pricing, Promotions, CMS Landings, and System Config.
  - **Marketing Specialist:** Access to Landing Pages, Banners, Collections, and Promotional Codes.
  - **Operations / Fulfillment:** Access to Orders, Inventory Allocation, Shipments, and Dispatches.
  - **Customer Service:** Read access to Orders/Customers; permission to initiate cancellations, track shipments, and execute refunds under defined financial thresholds.
  - **Management:** Read-only access to executive dashboards, sales reporting, and operational KPIs.
