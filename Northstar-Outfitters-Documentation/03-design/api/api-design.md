# API Design Specification

**Version:** 2.0  
**Format:** REST / JSON (OpenAPI 3.1)  
**Status:** DRAFT — FOR ARCHITECTURE REVIEW

---

## 1. API Architecture Principles

- **Consumer-Driven Namespace Separation:** Public customer traffic, privileged administrative tools, and automated webhooks are strictly separated into discrete URL paths with distinct security filters.
- **Contract-First Specification:** OpenAPI 3.1 specifications define contracts; client SDKs and TypeScript types are generated automatically.
- **DTO Isolation:** Persistence models and domain entities are never exposed in API representations.
- **Standardized Error Representation:** All errors adhere to **RFC 7807 (Problem Details for HTTP APIs)**.
- **Deterministic Idempotency:** Modifying operations support the `Idempotency-Key` header.
- **Correlation Tracking:** The `X-Correlation-ID` header is accepted or generated and propagated across all log entries and downstream calls.

---

## 2. API Endpoints by Consumer

### A. Storefront Public API (`/api/v1/storefront`)
High-volume, cache-friendly, authenticated via stateless customer JWT or anonymous session cookies.

```text
# Catalog & Search
GET    /api/v1/storefront/products                  # List products (filters: category, price, tag, pagination)
GET    /api/v1/storefront/products/{slug}           # Detailed product information & SKU options
GET    /api/v1/storefront/categories                # Category taxonomy tree

# Dynamic Marketing Landings (CMS)
GET    /api/v1/storefront/landings/{slug}           # Fetch dynamic landing page block layout
GET    /api/v1/storefront/banners/active            # Active promotional header banners

# Shopping Cart (Guest or Customer)
GET    /api/v1/storefront/cart                      # Retrieve current active cart
POST   /api/v1/storefront/cart/items                # Add SKU item to cart
PATCH  /api/v1/storefront/cart/items/{itemId}       # Update item quantity
DELETE /api/v1/storefront/cart/items/{itemId}       # Remove item
POST   /api/v1/storefront/cart/merge                # Merge anonymous cart into logged-in user cart

# Checkout & Orders
POST   /api/v1/storefront/checkout/estimate         # Calculate delivery fees & taxes for address
POST   /api/v1/storefront/checkout/submit           # Submit order & create payment intent (reserves inventory)
GET    /api/v1/storefront/orders/{orderNumber}      # Customer view of order status & tracking
POST   /api/v1/storefront/orders/{orderNumber}/cancel # Customer self-cancellation (if in PENDING_PAYMENT/PAID)

# Customer Portal
POST   /api/v1/storefront/auth/register             # Customer registration
POST   /api/v1/storefront/auth/login                # Customer login (returns JWT)
GET    /api/v1/storefront/customer/profile          # Profile details
GET    /api/v1/storefront/customer/addresses        # Address book
POST   /api/v1/storefront/customer/addresses        # Add address
```

### B. Administrative & Operations API (`/api/v1/admin`)
Secured via Corporate OIDC / MFA and Spring Security RBAC.

```text
# Catalog & Inventory
POST   /api/v1/admin/catalog/products               # Create product [PERM_CATALOG_WRITE]
PUT    /api/v1/admin/catalog/products/{id}          # Update product details
GET    /api/v1/admin/inventory/positions            # View stock levels & discrepancy alerts [PERM_INVENTORY_READ]
POST   /api/v1/admin/inventory/sync                 # Trigger manual ERP inventory sync

# Orders & Fulfillment
GET    /api/v1/admin/orders                         # List orders with status filters [PERM_ORDERS_READ]
GET    /api/v1/admin/orders/{id}                    # Full order aggregate with line-item detail
POST   /api/v1/admin/orders/{id}/lines/{lineId}/cancel # Partial line-item cancellation [PERM_ORDERS_WRITE]
POST   /api/v1/admin/fulfillment/dispatches         # Create fulfillment dispatch with tracking number

# Financial & Returns
POST   /api/v1/admin/refunds                        # Execute administrative refund [PERM_REFUND_EXECUTE]
GET    /api/v1/admin/returns                        # List pending return requests

# Marketing & CMS
POST   /api/v1/admin/cms/landings                   # Create / update landing page layout [PERM_MARKETING_WRITE]
PUT    /api/v1/admin/cms/landings/{id}/publish      # Schedule or publish campaign landing
```

### C. Webhooks Ingress (`/api/v1/webhooks`)
External provider callbacks; public internet facing with signature verification.

```text
POST   /api/v1/webhooks/payments/{provider}         # Payment gateway status callback (HMAC verified)
POST   /api/v1/webhooks/logistics/{carrier}         # Carrier shipment tracking update
POST   /api/v1/webhooks/erp/stock-delta             # Real-time ERP stock adjustment push
```

---

## 3. Standardized Error Format (RFC 7807)

All non-2xx responses return `application/problem+json`:

```json
{
  "type": "https://api.northstaroutfitters.com/errors/inventory-insufficient",
  "title": "Insufficient Sellable Stock",
  "status": 409,
  "detail": "SKU NSO-ALP-TENT-4P only has 1 unit available, but 2 were requested.",
  "instance": "/api/v1/storefront/checkout/submit",
  "code": "ERR_INVENTORY_OVERALLOCATION",
  "invalidParams": [
    {
      "name": "items[0].quantity",
      "reason": "Requested quantity exceeds sellable stock"
    }
  ],
  "correlationId": "c9a41e4a-4632-4d1e-8e47-e31bb219808d",
  "timestamp": "2026-09-30T10:45:00Z"
}
```

---

## 4. Pagination, Filtering & Sorting Standards

Collection endpoints conform to uniform query conventions:

- **Pagination:** `?page=1&size=20` (defaults to size 20, max 100). Response includes metadata:
  ```json
  "meta": {
    "page": 1,
    "size": 20,
    "totalElements": 142,
    "totalPages": 8
  }
  ```
- **Sorting:** `?sort=createdAt,desc` or `?sort=price,asc`.
- **Filtering:** `?status=PAID&categoryId=tents&priceMin=100&priceMax=500`.

---

## 5. Webhook Security Verification Rules

1. **Raw Body Inspection:** The raw HTTP request body bytes are extracted before JSON parsing to compute HMAC SHA-256 signatures against the configured secret key.
2. **Replay Window Check:** The `X-Webhook-Timestamp` header is verified against server time; timestamps older than 300 seconds are rejected with `401 Unauthorized`.
3. **Idempotent Acknowledgment:** Webhooks return `200 OK` or `202 Accepted` immediately once recorded. If the event ID was already processed, the endpoint returns `200 OK` without re-executing side effects.

