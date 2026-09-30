# AWS Cloud Architecture Specification

**Version:** 2.0  
**Cloud Provider:** Amazon Web Services (AWS)  
**Provisioning:** 100% Terraform (Infrastructure as Code)  
**Status:** Architecture Baseline

---

## 1. Cloud Topology Diagram

```text
                                [ Public Customers ]
                                         │
                                         ▼
                            [ Amazon Route 53 (DNS) ]
                                         │
                                         ▼
                         [ AWS WAF (Web App Firewall) ]
                                         │
                                         ▼
                       [ Amazon CloudFront (Global CDN) ]
                       /                                \
           (Static Assets / Images)             (Dynamic HTML / APIs)
                     │                                    │
                     ▼                                    ▼
             [ Amazon S3 ]                    [ Application Load Balancer ]
          (Optimized AVIF/WebP)              /                            \
                                            /                              \
                                           ▼                                ▼
                         [ Next.js Storefront ECS Service ]   [ Backend Core Monolith ECS Service ]
                         - AWS Fargate (Private Subnet)       - AWS Fargate (Private Subnet)
                         - SSR / ISR Page Generation          - Java 21 / Spring Boot 3
                         - Auto-scaling (CPU / Memory)        - Auto-scaling (CPU / Latency)
                                           \                              /
                                            \                            /
                                             ▼                          ▼
                                       [ Internal VPC Peering / Private Security Groups ]
                                                  │                        │
                                                  ▼                        ▼
                                     [ ElastiCache (Redis) ]      [ Amazon RDS PostgreSQL ]
                                     - Multi-AZ Replication       - Multi-AZ High Availability
                                     - Cart Sessions & TTL        - Logically Partitioned Schemas
                                     - Hot Inventory Positions    - Automated Daily Snapshots
                                                                  - Read Replicas (Optional)
```

---

## 2. Infrastructure as Code (IaC) Architecture

All cloud resources are codified in modular **Terraform** configurations stored in `/infrastructure/terraform`:

```text
infrastructure/terraform/
├── environments/
│   ├── dev/            # Fast-cycle, single-AZ, minimal instances for development
│   ├── qa/             # Integration testing environment
│   └── prod/           # Multi-AZ, automated backups, WAF rate-limiting, strict IAM
└── modules/
    ├── vpc/            # 3-AZ public/private subnet topology with NAT Gateways
    ├── alb/            # Application Load Balancer with TLS termination & path routing
    ├── ecs/            # Fargate cluster, task definitions, and auto-scaling policies
    ├── rds/            # PostgreSQL 16 instance with automated storage autoscaling
    ├── elasticache/    # Redis cluster with in-transit and at-rest encryption
    ├── cloudfront/     # CDN distribution, origin groups, cache policies, and S3 bucket
    └── security/       # IAM execution roles, security groups, KMS keys, Secrets Manager
```

---

## 3. Security Baseline & Network Segregation

1. **VPC Subnet Isolation:**
   - **Public Subnets:** Only the internet-facing ALBs and NAT Gateways reside here.
   - **Private Application Subnets:** ECS Fargate tasks (Next.js and Spring Boot) have zero public IPs and egress through NAT Gateways.
   - **Private Database Subnets:** RDS PostgreSQL and ElastiCache Redis have zero internet routes and are reachable only by the application security group.
2. **Encryption:**
   - **In-Transit:** Mandatory TLS 1.3 on all external and internal ALB connections.
   - **At-Rest:** AWS KMS customer-managed keys (CMK) encrypt RDS volumes, ElastiCache storage, S3 asset buckets, and CloudWatch log groups.
3. **Secrets Management:**
   - All credentials (database master passwords, payment provider API keys, webhook signing secrets) are stored in **AWS Secrets Manager** and injected into ECS task definitions at startup via IAM roles.

---

## 4. Cost Optimization Strategy

- **Fargate Right-Sizing:** Dev and QA use low-cost task sizes (0.25 vCPU, 0.5 GB RAM); Production auto-scales between 2 and 10 tasks (1.0 vCPU, 2.0 GB RAM) based on CPU/Memory utilization thresholds (70%).
- **CloudFront Offload:** Over 80% of product images, CSS/JS bundles, and static landing page requests are served from CloudFront edge caches, minimizing egress costs and backend CPU consumption.

