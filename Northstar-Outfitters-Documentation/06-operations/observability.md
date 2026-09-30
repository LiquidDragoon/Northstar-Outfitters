# Observability

## Logs

Structured logs should include:

- timestamp,
- level,
- service/module,
- correlation ID,
- operation,
- relevant business identifier,
- outcome.

## Metrics

Initial candidates:

- request rate,
- latency,
- error rate,
- checkout failures,
- payment failures,
- inventory reservation failures,
- refund failures,
- webhook processing failures,
- order state transition failures.

## Alerts

High-priority operational incidents include, at minimum, payment refund API failure/timeouts after a paid inventory allocation failure.

## Tracing

Distributed tracing may be introduced where integration complexity justifies it. Correlation IDs are required even before full tracing is adopted.
