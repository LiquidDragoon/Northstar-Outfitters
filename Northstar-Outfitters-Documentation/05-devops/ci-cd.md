# GitLab CI/CD

## Proposed pipeline

```text
Commit
  ↓
Compile
  ↓
Unit tests
  ↓
Integration tests
  ↓
Static analysis
  ↓
Security scanning
  ↓
Build container
  ↓
Push image to ECR
  ↓
Deploy
  ↓
Smoke tests
```

## Merge request gates

At minimum:

- build,
- tests,
- static analysis,
- security checks.

## Branch protection

Production deployment should not depend on a developer pushing directly to the protected branch.

## Artifacts

CI should preserve:

- test reports,
- coverage reports where useful,
- static analysis results,
- build metadata,
- container image identifiers.
