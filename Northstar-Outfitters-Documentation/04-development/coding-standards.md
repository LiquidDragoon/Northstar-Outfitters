# Coding Standards

## Java

- Use current supported LTS Java version selected by the project.
- Prefer immutable value objects where appropriate.
- Use meaningful names over comments explaining unclear code.
- Avoid checked exceptions for routine domain validation unless justified.
- Keep domain logic framework-independent.

## Spring

Spring annotations belong primarily in application/adapter/infrastructure layers.

## Persistence

JPA entities remain persistence concerns.

Do not expose JPA entities through REST APIs.

## Exceptions

Define stable application/domain error categories.

Do not expose stack traces or provider internals to clients.

## Logging

Use structured logs.

Never log:

- passwords,
- access tokens,
- payment secrets,
- unnecessary PII,
- full payment credentials.
