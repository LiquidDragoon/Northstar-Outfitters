# Development Guidelines

## Module ownership

Developers work primarily within assigned business modules.

Cross-module changes require explicit review from affected module owners.

## Coding rules

- Prefer clear domain language.
- Avoid framework annotations in domain classes.
- Avoid static global state.
- Avoid leaking persistence models into application APIs.
- Keep use cases focused.
- Prefer composition over unnecessary inheritance.
- Validate business invariants centrally.

## Branching

Recommended:

```text
main
  ↑
feature/*
bugfix/*
```

Changes reach `main` through merge requests and required CI checks.

A separate long-lived develop branch should only be introduced if the team's delivery model actually requires it.

## Commit guidance

Use concise, meaningful commits.

Examples:

```text
feat(inventory): add reservation expiration
fix(payment): reject duplicate provider callback
test(order): validate invalid state transition
```
