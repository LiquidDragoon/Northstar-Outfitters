# Deployment Strategy

## Initial strategy

Use rolling deployment for the first production implementation unless application behavior requires blue/green deployment.

## Requirements

Deployments must:

- be repeatable,
- be observable,
- support health checks,
- preserve database compatibility,
- have a rollback plan.

## Database compatibility

Application and schema changes should be deployed in an order that avoids breaking currently running application instances.

## Rollback

Application rollback should be possible independently from database rollback where practical.

Irreversible migrations require additional review.
