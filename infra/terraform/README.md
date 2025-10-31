# Infrastructure (Terraform)

This folder provisions core AWS infrastructure for the app: VPC/networking, RDS PostgreSQL, DynamoDB tables, ElastiCache Redis, S3 buckets, IAM, ECS Fargate, ALB, CloudFront, Route 53, ACM, and Secrets rotation.

## Prerequisites
- Terraform >= 1.6
- AWS account and credentials configured (via environment, profile, or SSO)
- Admin/PowerUser permissions to create AWS resources

## Usage
```bash
cd infra/terraform

terraform init
terraform plan -var "project=clubapp" -var "environment=dev" -var "aws_region=us-east-1" -var "domain_name=desh.co"
terraform apply -var "project=clubapp" -var "environment=dev" -var "aws_region=us-east-1" -var "domain_name=desh.co"
```

## Domain and DNS (desh.co)
- A public hosted zone is created when `enable_domain=true` (default).
- The output `route53_name_servers` lists 4 NS records. In GoDaddy, set custom nameservers to these values.
- ACM certs are issued and DNS‑validated for:
  - `assets.desh.co` (CloudFront)
  - `api.desh.co` (ALB)
- DNS records:
  - `assets.desh.co` → CloudFront alias
  - `api.desh.co` → ALB alias

## Secrets rotation
- RDS password is stored in Secrets Manager and a rotation Lambda (SAR) rotates credentials every 30 days.
- App should read the connection secret from `db_secret_arn` output (JSON fields: `host`, `port`, `username`, `password`, `dbname`).

## GitHub Actions (Terraform)
- Workflow at `.github/workflows/terraform.yml` uses OIDC to assume an AWS role.
- In GitHub repo settings:
  - Add secret `AWS_ROLE_TO_ASSUME` with the role ARN.
  - Set variables `PROJECT`, `AWS_REGION` if needed.
- In AWS, create an IAM role for GitHub OIDC with trust policy for your repo.

## Outputs
- `vpc_id`, `public_subnet_ids`, `private_subnet_ids`
- `alb_dns_name`, `cloudfront_assets_domain`
- `rds_endpoint`, `redis_primary_endpoint`
- `s3_assets_bucket`, `route53_name_servers`, `db_secret_arn`

## Notes
- RDS PostGIS enablement is a DB migration step.
- Costs: Multi‑AZ RDS, NAT per AZ, ElastiCache, CloudFront, and Route 53.
