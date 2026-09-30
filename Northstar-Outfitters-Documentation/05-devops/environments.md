# Environments

## Proposed environments

### Development

Local developer environment.

Purpose:

- fast feedback,
- unit tests,
- integration tests,
- local database/container dependencies.

### QA

Shared environment for integration and acceptance testing.

### Production

Customer-facing environment.

## Principle

Do not create environments merely for naming consistency. Each environment should have a purpose and owner.

## Configuration

Environment-specific values must not be hardcoded.

Secrets must be stored in an appropriate secret-management system.
