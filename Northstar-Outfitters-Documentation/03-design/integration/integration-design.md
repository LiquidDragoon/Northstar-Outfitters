# Integration Design Specification

**Version:** 2.0  
**Status:** Architecture Baseline

---

## 1. Checkout, Payment Webhook & Asynchronous Commit Flow

This sequence illustrates checkout submission, client-side tokenization, 15-minute stock reservation, and browser-disconnect recovery via the payment webhook (`FR-ORD-001`, `FR-INV-002`).

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer Browser
    participant SF as Next.js Storefront
    participant API as Modular Monolith (Orders/Inventory)
    participant PG as Payment Gateway (Stripe/Adyen)
    participant OB as Transactional Outbox

    Customer->>SF: Click "Authorize Payment"
    SF->>API: POST /checkout/submit (Idempotency-Key)
    activate API
    API->>API: Begin DB Transaction
    API->>API: Lock & Reserve Stock (15m TTL)
    API->>PG: Create Payment Intent (Amount, Currency, Return URL)
    PG-->>API: Intent Created (Client Secret / Token)
    API->>API: Commit Order (PENDING_PAYMENT) & Reservation
    API-->>SF: Return Client Secret
    deactivate API

    SF->>PG: Confirm Card / 3DS Challenge
    Note over Customer,PG: Browser may disconnect or crash here!

    PG-->>SF: Payment Authorized (UI Feedback only)
    
    Note over PG,API: Authoritative asynchronous webhook arrives
    PG->>API: POST /webhooks/payments (Signature, Event: payment_intent.succeeded)
    activate API
    API->>API: Verify HMAC Signature & Timestamp
    API->>API: Begin DB Transaction
    API->>API: Transition Order: PENDING_PAYMENT -> PAID
    API->>API: Commit Inventory: RESERVED -> COMMITTED
    API->>OB: Write Domain Event: PaymentSucceededEvent
    API->>API: Commit DB Transaction
    API-->>PG: 200 OK (Acknowledged)
    deactivate API
```

---

## 2. Automated Compensation Workflow (`FR-INV-003`)

If an unexpected deficit occurs post-payment (e.g. physical warehouse loss or rare lock collision), the system automatically refunds the charge without human delay.

```mermaid
sequenceDiagram
    autonumber
    participant PG as Payment Gateway
    participant API as Webhook Receiver
    participant INV as Inventory Module
    participant PAY as Payments Module
    participant ORD as Orders Module
    participant OPS as CloudWatch / PagerDuty

    PG->>API: Webhook: payment_intent.succeeded
    API->>INV: Commit Reserved Stock
    INV-->>API: ERROR: Allocation Failed (Deficit / Expired)
    
    Note over API,PAY: Trigger Automated Financial Compensation
    API->>PAY: Execute Refund (Original Amount, Reason: INVENTORY_SHORTAGE)
    
    alt Payment Provider Refund API Succeeds
        PAY->>PG: POST /v1/refunds (Idempotency-Key)
        PG-->>PAY: 200 OK (Refund ID)
        PAY->>ORD: Transition Order -> CANCELLED_REFUNDED
        PAY->>API: Emit OrderCompensatedRefundEvent
        API-->>Customer: Transactional Email: Apology & Full Refund Notice
    else Payment Provider Refund API Times Out or Fails
        PAY->>OPS: EMIT CRITICAL INCIDENT (SEV-1)
        PAY->>ORD: Transition Order -> PENDING_MANUAL_REFUND
        Note over OPS: Customer Support Runbook Triggered Immediately
    end
```

---

## 3. ERP Pessimistic Inventory Synchronization (`FR-INV-001`)

```mermaid
sequenceDiagram
    autonumber
    participant ERP as Enterprise Resource Planning (ERP)
    participant ADPT as ERP Adapter
    participant INV as Inventory Module
    participant DB as PostgreSQL (inventory.positions)

    ERP->>ADPT: Push Daily / Hourly Stock Delta Feed
    activate ADPT
    loop For Each SKU Record
        ADPT->>INV: UpdateStock(sku, erpQuantity)
        activate INV
        INV->>DB: Fetch Local Sellable Quantity
        
        Note over INV: Pessimistic Rule: min(local, erp)
        alt erpQuantity < 0
            INV->>DB: Log Data Error (REJECTED, Negative Stock)
        else Discrepancy Detected (ERP != Local)
            INV->>DB: UPDATE sellable_quantity = min(local, erp)
            INV->>INV: Emit Discrepancy Operational Warning
        else Quantities Match
            INV->>DB: UPDATE last_synced_at = NOW()
        end
        deactivate INV
    end
    ADPT-->>ERP: Batch Sync Acknowledged (Success / Error Count)
    deactivate ADPT
```

---

## 4. Integration Fault Model & Resiliency Matrix

| External Integration | Protocol | Auth Mechanism | Timeout | Retry Policy | Fallback / Failure Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Payment Gateway API** | HTTPS / REST | Bearer API Key in Secrets Mgr | 5,000ms | 3x with Exponential Backoff (Idempotency Key preserved) | Escalate to High-Priority Incident if compensation fails. |
| **Payment Webhook** | HTTPS / Ingress | Raw HMAC-SHA256 Signature + Timestamp | 3,000ms | Provider retries automatically on 5xx | Provider replay detection; return 200 OK if event ID is already processed. |
| **Logistics Carrier API** | HTTPS / REST | OAuth2 Client Credentials | 10,000ms | 3x with Exponential Backoff | Queue dispatch job in Outbox for asynchronous operational retry. |
| **ERP Inventory Sync** | SFTP / REST Webhook | mTLS or Signed API Token | 30,000ms | 2x batch retry | Log Data Error; freeze sellable quantity until next sync cycle; notify IT. |
| **Transactional Email / SMS** | HTTPS (Amazon SES / Twilio) | IAM / API Key | 3,000ms | 5x via Outbox queue | Dead-Letter Queue alert after 5 failures. |

