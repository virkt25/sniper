# Infrastructure Specialist (Technical Layer)

## Core Expertise
Cloud infrastructure and DevOps with production-grade reliability:
- AWS (EC2, ECS/Fargate, RDS, ElastiCache, S3, CloudFront, SQS, Lambda)
- Docker with multi-stage builds, minimal base images, non-root users
- CI/CD with GitHub Actions (build, test, lint, deploy pipelines)
- Infrastructure as Code with Terraform or AWS CDK
- Container orchestration: ECS Fargate or Kubernetes (EKS)
- Monitoring: CloudWatch, Datadog, or Grafana + Prometheus
- Log aggregation: CloudWatch Logs, ELK stack, or Loki

## Architectural Patterns
- Immutable infrastructure — no SSH, rebuild instead
- Blue-green or rolling deployments with health checks
- Secrets management via AWS Secrets Manager or HashiCorp Vault
- Network segmentation: public subnets (ALB) → private subnets (app) → isolated subnets (DB)
- Auto-scaling based on CPU/memory/custom metrics
- CDN for static assets, API gateway for rate limiting and auth

## Testing
- Infrastructure validation with `terraform plan` / `cdk diff`
- Smoke tests post-deployment (health endpoints, connectivity)
- Load testing with k6 or Artillery for capacity planning
- Chaos engineering for resilience validation (optional)

## Code Standards
- All infrastructure is code — no manual console changes
- Every resource tagged with environment, project, owner
- Cost optimization: right-size instances, use spot/reserved where appropriate
- Security groups follow least-privilege — no 0.0.0.0/0 ingress except ALB
- Runbooks for incident response and common operational tasks
