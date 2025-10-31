# GitHub Actions OIDC Provider and Role for CI/CD
# This allows GitHub Actions to authenticate with AWS using OIDC

# Create OIDC Provider for GitHub
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = merge(
    var.additional_tags,
    {
      Name = "${local.name_prefix}-github-oidc"
    }
  )
}

# IAM Role for GitHub Actions
resource "aws_iam_role" "github_actions" {
  name = "${local.name_prefix}-github-actions"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:shafkat1/socialclub-client-web:*"
          }
        }
      }
    ]
  })

  tags = merge(
    var.additional_tags,
    {
      Name = "${local.name_prefix}-github-actions"
    }
  )
}

# Policy for ECR access (push Docker images)
resource "aws_iam_role_policy" "github_actions_ecr" {
  name = "${local.name_prefix}-github-actions-ecr"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/${local.name_prefix}-backend"
      }
    ]
  })
}

# Policy for S3 access (frontend deployment)
resource "aws_iam_role_policy" "github_actions_s3" {
  name = "${local.name_prefix}-github-actions-s3"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.assets.arn}/*",
          "${aws_s3_bucket.receipts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.assets.arn,
          aws_s3_bucket.receipts.arn
        ]
      }
    ]
  })
}

# Policy for CloudFront invalidation
resource "aws_iam_role_policy" "github_actions_cloudfront" {
  name = "${local.name_prefix}-github-actions-cloudfront"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation"
        ]
        Resource = "*"
      }
    ]
  })
}

# Policy for Terraform (infrastructure deployment)
resource "aws_iam_role_policy" "github_actions_terraform" {
  name = "${local.name_prefix}-github-actions-terraform"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iam:*",
          "ec2:*",
          "rds:*",
          "elasticache:*",
          "ecs:*",
          "ecr:*",
          "s3:*",
          "cloudfront:*",
          "cloudformation:*",
          "route53:*",
          "acm:*",
          "logs:*",
          "kms:*",
          "secretsmanager:*",
          "elasticloadbalancing:*",
          "autoscaling:*"
        ]
        Resource = "*"
      }
    ]
  })
}

# Data source to get current AWS account ID
data "aws_caller_identity" "current" {}

# Output the role ARN for GitHub secrets
output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions OIDC role to use in GitHub repository secrets"
  value       = aws_iam_role.github_actions.arn
}
