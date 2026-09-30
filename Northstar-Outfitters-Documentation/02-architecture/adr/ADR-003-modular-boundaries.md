# ADR-003 — Business-Oriented Modular Boundaries and Enforcement

**Status:** Accepted  
**Date:** September 2026  
**Deciders:** Lead Solutions Architect, Technical Lead  

## Context

Northstar Outfitters is building a new e-commerce application to replace an operational legacy system. In monolithic architectures, applications frequently degrade into "big balls of mud" when developers directly query foreign tables or cross-inject domain classes, resulting in unmaintainable spaghetti code. Conversely, adopting microservices on Day 1 introduces distributed transactions, operational complexity, and network latency unsuited for the 6-month delivery timeline.

## Decision Drivers

- **Clean Domain Isolation:** Business rules in one domain (e.g. Orders) must not be corrupted by changes in another (e.g. Payments or Inventory).
- **Independent Evolution:** Modules should be structured so that extracting any module into an independent microservice in the future requires minimal refactoring.
- **Maintainability & Developer Onboarding:** A new developer must be able to work on `fulfillment` without understanding the internals of `catalog`.
- **Automated Verification:** Architectural rules must be mechanically verifiable in CI, not left to manual code review discipline.

## Considered Options

1. **Layered Monolith (Controller → Service → Repository):**
   - *Pros:* Familiar to all Java developers.
   - *Cons:* Fails to enforce business boundaries; cross-domain dependencies quickly proliferate.
2. **Spring Modulith with Package-Private Domain Encapsulation:**
   - *Pros:* Strong compile-time and runtime boundary verification; built-in event publication; natural modularization.
   - *Cons:* Learning curve for teams new to the library.
3. **Multi-Module Maven / Gradle Project:**
   - *Pros:* Physical compilation isolation between modules.
   - *Cons:* Slower build times, higher configuration overhead.

## Decision

We will structure the application around business capabilities using **Package-Private Domain Encapsulation verified by ArchUnit and Spring Modulith conventions**:

1. **Identified Business Modules:**
   - `catalog`
   - `inventory`
   - `orders`
   - `payments`
   - `fulfillment`
   - `returns`
   - `customer`
   - `cart`
   - `cms`

2. **Package Structure Rule:**
   ```text
   com.northstar.<module>
   ├── api/             (Public interfaces, commands, queries, DTOs, domain events)
   ├── domain/          (Package-private entities, value objects, domain services)
   ├── application/     (Package-private use-case service implementations)
   └── adapter/         (Package-private REST controllers, DB repositories, external clients)
   ```

3. **In-Process Communication:**
   - Module A can ONLY depend on Module B's `com.northstar.<module>.api` package.
   - Cross-module synchronous requests invoke public Application Service interfaces.
   - Cross-module asynchronous reactions use Spring `ApplicationEventPublisher` or Outbox events.
   - Direct access to foreign entities or Spring Data repositories is strictly forbidden.

4. **Automated CI Enforcement:**
   Automated **ArchUnit** tests will fail the build if any class imports an internal class or persistence entity from another module.

## Consequences

### Positive
- Strict, enforceable boundaries prevent technical debt and circular dependencies.
- Clear separation between public contracts and internal implementation details.
- Trivial extraction path to independent microservices if scaling demands it in Year 2+.

### Negative
- Developers must map internal entities to public DTOs when communicating across modules.
- Slightly higher initial boilerplate for ports and interfaces.
