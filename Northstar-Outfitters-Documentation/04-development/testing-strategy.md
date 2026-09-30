# Testing Strategy Specification

**Version:** 2.0  
**Status:** Architecture Baseline

---

## 1. Test Pyramid & Automation Layers

```text
               / \
              /   \
             / E2E \           Playwright (Landings, Cart, Checkout, Mobile)
            /-------\
           / Contract\         Pact / WireMock (Payment Gateway, ERP, Carriers)
          /-----------\
         / Integration \       Testcontainers (PostgreSQL, Redis, Outbox, Flyway)
        /---------------\
       / Domain & Arch   \     JUnit 5, AssertJ, ArchUnit (Hexagonal & Package Rules)
      /-------------------\
```

---

## 2. Architectural Verification with ArchUnit

Automated architecture tests prevent erosion of hexagonal and modular monolith boundaries. These tests execute during every `mvn test` execution:

```java
@AnalyzeClasses(packages = "com.northstar", importOptions = ImportOption.DoNotIncludeTests.class)
public class ArchitectureTest {

    @ArchTest
    static final ArchRule domain_must_not_depend_on_spring_or_jpa =
        noClasses().that().resideInAPackage("..domain..")
            .should().dependOnClassesThat().resideInAnyPackage(
                "org.springframework..",
                "jakarta.persistence..",
                "org.hibernate..",
                "com.stripe.."
            );

    @ArchTest
    static final ArchRule modules_must_respect_public_api =
        classes().that().resideInAPackage("com.northstar.orders..")
            .should().onlyAccessClassesThat().resideInAnyPackage(
                "com.northstar.orders..",
                "com.northstar.inventory.api..",
                "com.northstar.payments.api..",
                "java..",
                "org.slf4j.."
            );
}
```

---

## 3. Domain & Unit Testing
- **Execution Speed:** Must run in < 15 seconds without starting Spring, Docker, or databases.
- **Coverage:** Pure business invariants (e.g. order state machine valid transitions, pessimistic inventory comparison calculation, discount proration math, reservation TTL expiry checks).

---

## 4. Integration Testing with Testcontainers
- **Infrastructure:** Tests run against real **PostgreSQL 16** and **Redis** containers managed by Testcontainers.
- **Validations:**
  - Database schema migrations (Flyway scripts).
  - High-concurrency inventory reservation query assertions (`UPDATE ... WHERE sellable_quantity >= :qty`).
  - Transactional Outbox insertion and `SKIP LOCKED` polling behavior.
  - Payment webhook signature validation and idempotency key duplicate rejection.

---

## 5. End-to-End (E2E) & Visual Regression Testing (Playwright)

Automated **Playwright** suites run against the Next.js Storefront in staging:

1. **Marketing Landing Pages:**
   - Verify dynamic block layout rendering (`hero_banner`, `category_grid`, `product_carousel`).
   - Validate mobile viewport responsiveness and touch carousel snapping.
   - Assert Core Web Vitals (LCP < 2.5s, CLS < 0.05).
2. **Critical Purchase Journeys:**
   - Guest user browses landing page → adds SKU to cart → calculates shipping → authorizes payment via test token → receives order confirmation.
   - Disconnected browser recovery: Simulate tab close post-payment; verify order transitions to `PAID` via webhook.
   - Partial fulfillment and admin refund verification.

---

## 6. Continuous Integration Gates

A Merge Request (MR) can only be merged into `main` if:
- [x] All unit, domain, and ArchUnit tests pass (100% green).
- [x] Integration tests pass on Testcontainers.
- [x] Line coverage on core `domain` packages exceeds 85%.
- [x] Static vulnerability scans (SonarQube / Checkmarx / Trivy) report 0 Critical / 0 High vulnerabilities.

