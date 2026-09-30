# Incident Management

## Severity

### High

Examples:

- refund operation failed after paid inventory allocation failure,
- widespread checkout failure,
- payment webhook processing failure affecting many orders,
- production database unavailable.

### Medium

Examples:

- degraded non-critical integration,
- elevated but recoverable error rate.

### Low

Examples:

- isolated non-critical administrative failure.

## Incident record

Capture:

- timestamp,
- affected functionality,
- detection source,
- impact,
- timeline,
- actions taken,
- root cause,
- corrective action,
- owner.

## Principle

Incident response should focus first on customer/business impact and safe recovery, then on root-cause analysis.
