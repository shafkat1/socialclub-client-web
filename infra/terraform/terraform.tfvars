# ============================================
# TERRAFORM VARIABLES - SOCIALCLUB RECOMMENDED TIER
# ============================================
# Date: October 31, 2025
# Tier: Recommended ($140-150/month)
# Configuration: Optimized MVP with cost control

# ============================================
# PROJECT & ENVIRONMENT
# ============================================
project       = "clubapp"
environment   = "dev"
aws_region    = "us-east-1"
az_count      = 2

# ============================================
# NETWORKING
# ============================================
vpc_cidr = "10.0.0.0/16"

# ============================================
# DOMAIN & DNS
# ============================================
domain_name   = "desh.co"
enable_domain = true

# ============================================
# DATABASE (RDS PostgreSQL)
# ============================================
# DOWNGRADED TO MICRO FOR MVP ($32/month vs $65/month)
db_instance_class      = "db.t4g.micro"
db_allocated_storage   = 20
db_max_allocated_storage = 100
db_multi_az            = false
db_backup_retention    = 7
db_publicly_accessible = false

# ============================================
# CACHE (ElastiCache Redis)
# ============================================
# SINGLE NODE REDIS MICRO
redis_node_type        = "cache.t4g.micro"
redis_num_cache_nodes  = 1
redis_automatic_failover = false

# ============================================
# STORAGE (S3)
# ============================================
# S3 bucket names (auto-generated with project prefix)
# s3_assets_bucket   = "clubapp-dev-assets"
# s3_receipts_bucket = "clubapp-dev-receipts"
# s3_logs_bucket     = "clubapp-dev-logs"

# ============================================
# COMPUTE (ECS FARGATE)
# ============================================
# DOWNGRADED TO 0.5 vCPU / 1GB FOR MVP
ecs_task_cpu           = "256"
ecs_task_memory        = "1024"
ecs_desired_count      = 2
ecs_max_capacity       = 2
ecs_min_capacity       = 2
ecs_enable_autoscaling = false

# ============================================
# LOAD BALANCER (ALB)
# ============================================
alb_internal           = false
alb_enable_logging     = false
alb_deletion_protection = false

# ============================================
# SECURITY
# ============================================
enable_waf                        = false
enable_network_acl_restrictions   = false

# ============================================
# TAGS
# ============================================
additional_tags = {
  Environment = "development"
  Tier        = "recommended"
  CostCenter  = "mvp"
  CreatedDate = "2025-10-31"
  Team        = "backend"
}
