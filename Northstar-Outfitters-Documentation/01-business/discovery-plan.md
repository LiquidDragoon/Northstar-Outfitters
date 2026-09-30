## DISCOVERY & ASSESSMENT PLAN

**Project:** Northstar Outfitters — E-Commerce Platform Modernization **Reference:** NSO-ECOM-2026-01 / Discovery Phase **Prepared by:** Technical Consultancy Partner **Date:** September 2026

**1. Objectives** The primary objective of this Discovery & Assessment Phase is to evaluate Northstar Outfitters' business processes, data structures, and operational constraints to establish the implementation roadmap for the **new e-commerce platform**. Specifically, this phase aims to:

- Extract unwritten business logic and edge cases from internal IT and operational staff without impacting live operations.
- Map and reverse-engineer legacy database schemas and third-party integrations (ERP, payment gateways, logistics, tax calculators).
- Define the **Data Migration & Cutover Blueprint** (catalog, inventory, customer accounts, order history).
- Deliver detailed domain specifications, target API contracts, and an infrastructure cost model for executive sign-off prior to sprint execution.

## 2. Scope

## In Scope:

- **Business Domain Discovery:** Tracing real-world workflows for inventory pessimistic sync, split-shipment logistics, order cancellation windows, and customer refund policies.
- **Data & Migration Mapping:** Reverse-engineering legacy product data, customer password hashes, active gift cards, and inventory tables into target PostgreSQL schemas.
- **Integrations:** Mapping API contracts, webhook payloads, and authentication models for external ERP, payment providers, and carrier shipping systems.
- **Non-Functional Requirements:** Security, PCI-DSS compliance boundaries, Core Web Vitals targets for marketing landings, and holiday traffic surge requirements.

## Out of Scope:

- Refactoring or deploying changes to the legacy codebase.
- Stress testing or modifications directly on the live production environment.

## 3. Key Activities

[ WEEKS 1 - 2]               [ WEEKS 2 - 3]                   [ WEEK 4]
Domain Discovery &          Data Migration & Integration     Architecture Finalization &
Stakeholder Interviews  ---> Mapping & Schema Target     ---> Executive Roadmap & Cutover Plan

- **Domain & Stakeholder Interviews:** Structured sessions with IT, warehouse operations, fulfillment, and customer service to uncover edge cases.
- **Data Migration & Schema Mapping:** Profiling legacy data quality, catalog categorization, customer credential formats, and mapping them to target hexagonal domain models.
- **Integration Contract Definition:** Documenting explicit OpenAPI specs and webhook contracts for the Payment Gateway, ERP, and Shipping carriers.
- **Roadmap & Cutover Synthesis:** Finalizing implementation sprints, team composition, AWS infrastructure estimates, and staging the rehearsal cutover plan.

## 4. Stakeholders & Interviews

To gain a holistic view of the platform, we propose short, structured sessions (45–60 mins each) with the following key personnel: **Role / Team Focus / Objective**

| Internal IT   | Deep dive into system architecture, legacy code         |
| ------------- | ------------------------------------------------------- |
|               | constraints, database logic, known bugs, and deployment |
| Personnel (2) | procedures.                                             |

| Operations &     | Reviewing order processing, stock updates, return |
| ---------------- | ------------------------------------------------- |
| Fulfillment Team | handling, and identifying manual workarounds.     |

## Role / Team Focus / Objective

| Customer Service | Understanding common customer friction points during |
| ---------------- | ---------------------------------------------------- |
| Team             | checkout, payment failures, or account issues.       |

## 5. Information and Access Required

To execute the assessment without delay, Northstar Outfitters will need to provide:

- Access to source code repositories (Git/Azure DevOps/SVN).
- Read-only access to a development/staging database copy (containing anonymized data if necessary).
- Existing documentation (if any), API specs, or third-party service credentials for QA/Dev environments.
- Contact points for key personnel to schedule interview sessions.

## 6. Assessment Criteria

Technical findings will be categorized into three business-oriented dimensions rather than purely abstract code metrics:

1. **Maintainability (Development Friction):** Measures how easy or difficult it is to introduce new features. High technical debt directly correlates with higher future development costs and slower time-to-market.
2. **Security & Reliability (Financial & Reputational Risk):** Identifies vulnerabilities, payment gateway stability issues, and single points of failure that could lead to downtime, data breaches, or lost revenue.
3. **Scalability (Growth Preparedness):** Evaluates if the current architecture can support anticipated traffic surges without performance degradation or system crashes.

## 7. Key Deliverables

At the conclusion of this phase, Northstar Outfitters will receive an **Executive** **Discovery Report** containing:

- **Technical Health & Security Audit:** Clear risk ratings (Low/Medium/High) covering code quality, security vulnerabilities, and platform stability.

- **Integration & Architecture Map:** A visual and descriptive inventory of all internal/external integrations and their business criticality.
- **Operational Friction Report:** Identified manual processes with recommendations for automation.
- **Executive Decision Matrix:** A structured comparison between **Option A** **(Incremental Modernization)** and **Option B (Platform Replacement)**, evaluating: o Estimated total cost and effort. o Timeline targeting the initial 6-month launch goal. o Operational and technical risk profiles. o Expected Return on Investment (ROI) and scalability over the next 3–5
  years.

**8. Timeline (4-Week Schedule)**

| Week   | Focus                                                                               | Main Deliverables / Milestones                                               |
| ------ | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Week 1 | Access setup, local environment build, automated static code and security scanning. | Repository cloned; scanning tools configured; initial code metrics gathered. |
| Week 2 | Technical IT interviews, integration tracing, and initial architectural mapping.    | Integration inventory complete; IT technical debt report drafted.            |
| Week 3 | Operations & Customer Service interviews; manual workflow analysis.                 | Operational bottleneck report; business risk translation complete.           |
| Week 4 | Strategic synthesis, cost/effort modeling, and draft of Decision Matrix.            | Final Executive Discovery Report & Management Presentation.                  |

## 9. Assumptions and Constraints

- **Zero Operational Disruption:** All analysis, testing, and inspection will strictly occur in isolated local/QA environments. The live store will remain completely unaffected.
- **Information Availability:** Timely provision of access credentials and scheduling of interviews within Weeks 1 and 2 are essential to meet the 4-week delivery window.
- **Scope Refinement:** The outcomes of this discovery phase will serve as the baseline for defining the definitive scope, budget, and contract for the implementation phase.
