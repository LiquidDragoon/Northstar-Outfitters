# ADR-005 — Authentication, Customer Identity, and Role-Based Access Control

**Status:** Accepted  
**Date:** September 2026  
**Deciders:** Lead Solutions Architect, Security Specialist  

## Context

Northstar Outfitters has two distinct user populations with completely different security profiles:
1. **Public E-Commerce Customers:** High volume, anonymous browsing, guest checkout, password/social sign-in, mobile-responsive self-service.
2. **Internal Administrative & Operational Staff:** High privilege, access to customer PII, order dispatch, inventory adjustments, and financial refunds.

## Decision Drivers

- **Security Isolation:** Administrative credentials must never share authentication mechanisms or session stores with customer credentials.
- **Least Privilege RBAC:** Strict operational roles (`E-Commerce Admin`, `Marketing Specialist`, `Operations/Fulfillment`, `Customer Service`, `Management`) as mandated by FRS `FR-ADM-001`.
- **Stateless API Compatibility:** Support modern headless storefronts and mobile apps using stateless security tokens.
- **Auditability:** Every administrative action must identify the authenticated operator.

## Considered Options

1. **Monolithic Session-Based Auth for All Users:**
   - *Pros:* Simple.
   - *Cons:* Stateful sessions make scaling the headless storefront harder; risks mixing admin and customer session cookies.
2. **Third-Party Customer IAM (Auth0 / AWS Cognito / Firebase Auth) + Internal Admin SSO:**
   - *Pros:* Offloads credential management and social logins.
   - *Cons:* External SaaS subscription costs and vendor lock-in.
3. **Dual Architecture (Selected):**
   - **Customer Identity:** Lightweight Spring Security OAuth2 / JWT provider with Argon2id password hashing, guest checkout tokenization, and optional Social Sign-In (Google/Apple).
   - **Administrative Identity:** Enterprise OIDC/SAML integration (e.g. Google Workspace / Microsoft Entra ID) with mandatory Multi-Factor Authentication (MFA) and fine-grained Spring Security Method Security (`@PreAuthorize`).

## Decision

We implement a **Dual Security Architecture**:

1. **Customer Authentication:**
   - Stateless JWT tokens (short-lived access tokens, 15 minutes, with secure HttpOnly refresh cookies).
   - Guest sessions are issued an anonymous checkout token linked to an active cart session.
   - Passwords hashed using **Argon2id** (or BCrypt with cost factor 12).
2. **Administrative Access & RBAC:**
   - Integrated with Northstar's corporate Identity Provider via OpenID Connect (OIDC).
   - MFA is strictly enforced at the IdP level.
   - Role permissions are verified on every admin REST endpoint via `@PreAuthorize("hasAuthority('PERM_REFUND_EXECUTE')")`.
3. **Domain Independence:**
   - Domain layer models only have an abstract `UserId` value object. Spring Security `SecurityContext` and framework tokens are confined entirely to the web adapter layer.

## Consequences

### Positive
- Total isolation between customer traffic and privileged administrative functions.
- Seamless guest-to-customer transition.
- Comprehensive audit trail linking administrative user IDs to sensitive operations (refunds, cancellations).

### Negative
- Requires maintaining two security filter chains in Spring Boot.
