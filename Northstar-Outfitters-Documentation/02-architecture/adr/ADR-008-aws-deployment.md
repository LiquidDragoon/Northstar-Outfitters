# ADR-008 — Cloud Platform and Containerized Hosting on AWS

**Status:** Accepted  
**Date:** September 2026  
**Deciders:** Lead Solutions Architect, DevOps Lead  

## Context

Northstar Outfitters requires a scalable, highly reliable cloud environment to host both the backend Modular Monolith API and the Next.js Storefront/Landing page application. The infrastructure must handle peak holiday traffic surges, maintain PCI-DSS compliance boundaries, and remain cost-effective for a mid-sized retailer.

## Decision Drivers

- **Zero Server Maintenance:** Minimal operational overhead; avoid managing Linux kernels, OS patches, or hypervisors.
- **Reproducible Environments:** 100% Infrastructure as Code (IaC) to spin up identical Dev, QA, Staging, and Production environments.
- **High Availability & Fault Tolerance:** Multi-AZ redundancy for database and container compute.
- **Global Asset & Page Delivery:** Edge caching for marketing landing pages, catalog imagery, and static assets.

## Considered Options

1. **Self-Managed EC2 Instances with Docker Compose:**
   - *Pros:* Low direct AWS compute cost.
   - *Cons:* High maintenance overhead, manual auto-scaling, fragile failover.
2. **Amazon EKS (Kubernetes):**
   - *Pros:* Maximum flexibility and industry standard for large enterprises.
   - *Cons:* Enormous operational complexity, dedicated cluster management cost (\$72/mo base per cluster), excessive overhead for a single modular monolith.
3. **AWS ECS with AWS Fargate + CloudFront + RDS (Selected):**
   - *Pros:* Fully serverless container execution; pay-as-you-go; native IAM integration; zero cluster patching.

## Decision

We select **Amazon Web Services (AWS)** using **ECS Fargate and Managed Services with Terraform**:

1. **Compute (ECS / Fargate):**
   - **Backend API:** Containerized Spring Boot image deployed on AWS Fargate in private subnets, fronted by an Application Load Balancer (ALB).
   - **Storefront App:** Containerized Next.js Node.js server running on Fargate in private subnets.
2. **Edge & Content Delivery (Amazon CloudFront + S3):**
   - CloudFront CDN edge-caches product imagery, static bundles, and SSG/ISR landing pages.
   - Integrated with AWS WAF (Web Application Firewall) for DDoS and rate-limiting protection.
3. **Persistence (Amazon RDS PostgreSQL & ElastiCache Redis):**
   - RDS PostgreSQL Multi-AZ for automatic failover and daily automated snapshots.
   - ElastiCache Redis cluster for session cart storage, reservation TTL, and hot catalog query caching.
4. **Secrets & Security:**
   - AWS Secrets Manager for database credentials and third-party API keys (Stripe, ERP).
   - IAM Task Execution Roles adhering strictly to the principle of least privilege.
5. **Infrastructure as Code (IaC):**
   - All AWS resources are authored in **Terraform** (`hashicorp/aws` provider) with remote state stored in S3 and state locking via DynamoDB.

## Consequences

### Positive
- Fully managed serverless compute eliminates OS maintenance.
- Predictable, modular infrastructure provisioning via Terraform.
- Multi-AZ auto-scaling handles Black Friday traffic surges effortlessly.

### Negative
- Fargate startup time (cold start of ~45–60s) requires maintaining a minimum task count of 2 per service in Production.
