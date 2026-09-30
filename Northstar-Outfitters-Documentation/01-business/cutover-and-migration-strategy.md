# Cutover & Data Migration Strategy

**Reference:** NSO-ECOM-2026-01 / Migration Baseline  
**Project:** Northstar Outfitters — E-Commerce Platform Modernization  
**Document Version:** 1.0  
**Status:** DRAFT — FOR ARCHITECTURE REVIEW

---

## 1. Executive Summary & Context

Northstar Outfitters has decided to implement a **new application baseline** rather than refactoring legacy code in-place. While the system is greenfield from a codebase perspective, it must replace an actively trading e-commerce operation without disrupting ongoing customer sales, losing historical data, or corrupting stock counts.

This document defines the strategy for:
1. Extracting, cleansing, and transforming legacy data into the new schema.
2. Managing customer account credentials and security.
3. Conducting cutover rehearsals.
4. Executing production switchover with minimal customer downtime.

---

## 2. Migration Scope & Entity Mapping

| Entity | Legacy Source | Target Module & Schema | Strategy | Critical Invariant / Challenge |
| :--- | :--- | :--- | :--- | :--- |
| **Product Catalog & SKUs** | Legacy DB / ERP export | `catalog.products`, `catalog.skus` | Bulk extract, transform, load (ETL) | Normalize categories, map media assets to CloudFront/S3, preserve legacy URL slugs for SEO redirects. |
| **Sellable Inventory** | Legacy DB + ERP | `inventory.positions` | Cold sync 1 hour before cutover | Pessimistic rule applies immediately: lower of local and ERP stock becomes authoritative baseline. |
| **Customer Accounts** | Legacy DB | `customer.accounts`, `customer.addresses` | Asynchronous hash migration or self-serve password reset | Legacy password hashing algorithm (often legacy MD5/SHA1 vs target BCrypt/Argon2id). See Section 3. |
| **Open / In-Flight Orders** | Legacy DB | `orders.orders`, `fulfillment.groups` | Cutoff freeze & runout OR dual-run | Orders placed in legacy platform in `PENDING_PAYMENT` or `PROCESSING`. |
| **Historical Orders (Closed)** | Legacy DB | Archive data lake / read-only analytics DB | Read-only import or archival storage | Required for 7-year financial audit/tax compliance and customer purchase history views. |
| **Promotions & Gift Cards** | Legacy DB | `pricing.vouchers`, `pricing.gift_cards` | Full balance migration | Balances must match active ledger balances down to the cent. |

---

## 3. Customer Authentication & Credential Migration

Handling customer passwords across legacy and new systems is a critical security consideration:

```
[Customer Signs In on New Platform]
                 │
                 ▼
         Check Email Exists?
           /            \
       [Yes]            [No] ──► Invalid Credentials
         │
         ▼
Is Password Hash New (BCrypt)?
   /              \
 [Yes]            [No] (Legacy Hash)
   │               │
Verify BCrypt      Verify against Legacy Hash Algorithm
   │               │
   │               ├── Match: Re-hash password with BCrypt,
   │               │          save to DB, clear legacy flag.
   │               └── No Match: Invalid Credentials
   ▼
Issue Modern JWT / Session Token
```

### Fallback Policy: Secure Reset Campaign
If the legacy password hashing algorithm is insecure (e.g. unsalted MD5 or reversible encryption) or unknown, customer records are migrated with a `PASSWORD_RESET_REQUIRED` flag. On first login, customers are sent a secure, single-use, 24-hour expiration password reset link via transactional email.

---

## 4. In-Flight Order Cutover Models

To prevent order loss and webhook race conditions, Northstar Outfitters adopts the **Drain and Runout Strategy**:

```text
Time (Hours) ──────►
[-48h] Phase 1: Pre-cutover catalog & static customer sync to staging DB.
[-12h] Phase 2: Promotional campaign blackout (no new promotional emails sent).
[-2h]  Phase 3: Set legacy checkout into "Drain Mode":
       - Disallow new checkouts on legacy store (banner: "Platform maintenance in progress").
       - Allow all in-flight payment webhooks and warehouse dispatches to settle.
[0h]   Phase 4: Snapshot final inventory from ERP & legacy database.
       - Load delta customers and inventory into new PostgreSQL production database.
[+15m] Phase 5: Switch DNS / ALB ingress to new Modular Monolith.
[+30m] Phase 6: Post-launch smoke tests (end-to-end checkout, payment webhook, admin login).
[+1h]  Phase 7: Open storefront to public traffic; monitor CloudWatch error rates and order metrics.
```

---

## 5. SEO & URL Preservation Strategy

To prevent organic traffic loss (critical for outdoor retail search ranking):

1. **301 Permanent Redirect Map:** Legacy product URLs (e.g., `/item.php?id=123`) must be mapped in Amazon CloudFront (via CloudFront Functions) to new canonical slugs (e.g., `/products/alpine-mountaineering-tent-4p`).
2. **Sitemap Submission:** Immediate automated generation and submission of `sitemap.xml` to Google Search Console upon domain switch.
3. **Structured Data:** Implementation of Schema.org `Product`, `Offer`, and `BreadcrumbList` JSON-LD on all product detail and category landing pages.

---

## 6. Rollback Plan

If critical defects are identified within the first 2 hours post-cutover (e.g., payment webhook drop, inventory overselling, severe database latency):

1. **Rollback Trigger Conditions:**
   - Payment failure rate > 5% over 15 minutes.
   - Database deadlock or unhandled exception rate > 2%.
   - Inability to receive or verify carrier tracking callbacks.
2. **Execution Steps:**
   - Revert Route 53 DNS records back to legacy infrastructure (TTL reduced to 60 seconds 48h prior to cutover).
   - Export any orders placed on the new platform during the window and manually insert them into the legacy fulfillment queue.
   - Convene post-mortem analysis before scheduling a second cutover window.
