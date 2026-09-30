# Support Runbook — Initial Draft

## Payment webhook not received

1. Locate order by ID.
2. Inspect payment attempt.
3. Verify provider transaction/reference.
4. Check webhook logs.
5. Determine whether provider status is definitive.
6. Do not manually mark an order PAID without approved operational procedure.
7. Escalate if state cannot be reconciled safely.

## Refund failure

1. Locate original payment transaction.
2. Verify refund amount.
3. Inspect provider response.
4. Retry only if provider semantics guarantee idempotent/safe retry.
5. Escalate as High Priority when required by the FRS.

## Inventory discrepancy

1. Compare local and ERP stock.
2. Confirm synchronization status.
3. Check Data Error records.
4. Do not manually increase sellable stock without an approved process.

## Production deployment

1. Confirm CI green.
2. Confirm migration compatibility.
3. Confirm monitoring.
4. Deploy.
5. Run smoke tests.
6. Monitor error rate and critical business metrics.
7. Roll back if predefined failure thresholds are exceeded.
