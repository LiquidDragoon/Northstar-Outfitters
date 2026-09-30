# ADR-007 — Asynchronous Event Publishing via Transactional Outbox

**Status:** Accepted  
**Date:** September 2026  
**Deciders:** Lead Solutions Architect, Backend Architect  

## Context

Several business processes in Northstar Outfitters are inherently asynchronous:
1. Inventory reservation release upon 15-minute TTL expiration.
2. Dispatching order confirmation emails post-payment.
3. Notifying ERP systems of order commitments.
4. Emitting operational alerts when an automated refund fails.

A classic anti-pattern is publishing an event to a message broker (or sending an email) inside a database transaction before committing. If the database commit subsequently rolls back, the outside world received an event that never occurred (dual-write problem). Conversely, publishing *after* the commit risks server crash before publication, causing lost events.

## Decision Drivers

- **Zero Lost Business Events:** Once an order is marked `PAID`, all downstream reactions (ERP sync, email, fulfillment grouping) must eventually occur.
- **Low Operational Overhead:** Avoid deploying complex message broker clusters (Kafka, RabbitMQ) in Phase 1 before message throughput demands it.
- **At-Least-Once Delivery Guarantee:** Downstream consumers can handle idempotent replays.

## Considered Options

1. **Direct In-Memory Spring Events (`ApplicationEventPublisher`):**
   - *Pros:* Zero latency, no external dependencies.
   - *Cons:* Lost in memory if the server terminates before event handlers finish.
2. **External Message Broker on Day 1 (Amazon SQS/SNS or Apache Kafka):**
   - *Pros:* High throughput, robust dead-letter queues.
   - *Cons:* Dual-write failure modes without an outbox; adds cloud cost and local development complexity.
3. **Database Transactional Outbox + Scheduled Worker (Selected):**
   - *Pros:* Atomic persistence with business data; eliminates dual-write hazards; zero extra infrastructure.

## Decision

We implement the **Transactional Outbox Pattern** with a **PostgreSQL-backed Event Dispatcher**:

1. **Transactional Event Write:**
   - When an aggregate state changes (e.g. `Order` transitions to `PAID`), the use case saves the business entity and writes an event row to `technical.outbox_events` within the exact same database transaction.
2. **Polling Dispatcher with ShedLock:**
   - A Spring Boot scheduled worker runs every 1,000ms.
   - It queries pending outbox events using `SELECT ... FOR UPDATE SKIP LOCKED` (allowing horizontal scaling across multiple ECS tasks without lock contention).
   - The worker dispatches events to registered event handlers and/or AWS SQS queues.
   - Upon successful delivery, the event status is updated to `PROCESSED`.
3. **Poison Pill & Exponential Backoff:**
   - Failed events increment `retry_count`. After 5 consecutive failures, the event status transitions to `FAILED` and raises a High-Priority operational CloudWatch alert.

## Consequences

### Positive
- 100% guarantee against dual-write inconsistency and lost events.
- Zero extra operational infrastructure required initially.
- Effortlessly bridges to Amazon SQS or Kafka in the future if event volumes increase.

### Negative
- Minor polling load on PostgreSQL (negligible with partial indexes on `status = 'PENDING'`).
- Event consumers must be designed to be idempotent to handle at-least-once delivery.
