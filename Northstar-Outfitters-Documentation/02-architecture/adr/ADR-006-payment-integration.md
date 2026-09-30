# ADR-006 — Payment Gateway Abstraction, Webhook Reliability, and Idempotency

**Status:** Accepted  
**Date:** September 2026  
**Deciders:** Lead Solutions Architect, Integration Lead  

## Context

Online payments are the most financially sensitive capability of Northstar Outfitters. Requirements from FRS `FR-PAY-001`, `FR-PAY-002`, `FR-ORD-001`, and `FR-INV-003` dictate:
1. Double-click prevention and strict request idempotency.
2. Orders transition to `PAID` *exclusively* upon receiving signed asynchronous webhooks.
3. Resilience against browser drops during checkout.
4. Normalized capability mapping across providers (e.g. Stripe, Adyen, PayPal).
5. Automated compensation refunds when inventory allocation fails post-payment.

## Decision Drivers

- **Zero Duplicate Charges:** Network retries or rapid customer clicking must never trigger multiple charges.
- **Provider Interchangeability:** The core order lifecycle must never be coupled to a proprietary payment SDK.
- **PCI-DSS Compliance Scope Minimization:** Credit card numbers and CVVs must never touch Northstar backend servers (use hosted fields/Elements).
- **Asynchronous Integrity:** Browser disconnects must not cause lost sales or unfulfilled payments.

## Considered Options

1. **Direct Integration with Single Provider SDK (e.g. Stripe Java SDK in Order Service):**
   - *Pros:* Quick to set up.
   - *Cons:* Vendor lock-in; couples payment mechanics directly with order domain logic; violates Hexagonal Architecture.
2. **Synchronous Payment Authorization on Checkout Submission:**
   - *Pros:* Simpler UI flow.
   - *Cons:* Fails when 3DS / SCA challenges require customer redirection; browser disconnects cause hung transactions.
3. **Hexagonal PaymentGateway Port with Asynchronous Webhook Authority (Selected):**
   - *Pros:* Decouples domain from provider API; supports any gateway; minimizes PCI scope to SAQ A; handles browser drops gracefully.

## Decision

We establish a dedicated `payments` module with a **Hexagonal PaymentGateway Port**:

1. **Client-Side Tokenization (SAQ A):**
   - Payment credentials are submitted directly from the customer's browser to the payment provider's secure iframe/tokenization API.
   - Northstar backend receives only a payment token/method ID.
2. **Deterministically Generated Idempotency Key:**
   - Every outgoing payment intent includes a key: `IDEMP-${orderId}-${attemptUuid}`.
   - Database unique constraint on `payments.transactions.idempotency_key` guarantees duplicate incoming requests return the existing transaction.
3. **Webhook Processing & Cryptographic Verification:**
   - Webhook endpoints verify HMAC signatures with raw request bodies before JSON parsing.
   - Replay attacks are rejected using timestamp checking (+/- 5 minutes tolerance).
   - Order transition to `PAID` is triggered asynchronously by the verified webhook, independent of customer browser connectivity.
4. **Provider Capability Matrix:**
   - The port queries a capability registry (`supportsPartialRefund()`, `supportsDelayedCapture()`) before attempting operations, providing clear user feedback if an operation requires manual portal intervention.

## Consequences

### Positive
- Strict PCI-DSS SAQ A scope (no card data touches backend memory or logs).
- Immune to double-click and browser timeout issues.
- Clean provider switching without altering order state machine.

### Negative
- Requires robust local webhook emulation (e.g. Stripe CLI / ngrok) during local development and testing.
