#!/bin/bash
# Setup GitHub OIDC for Terraform CI/CD
# Usage: bash setup-github-oidc.sh <github-repo> <aws-region>
# Example: bash setup-github-oidc.sh shafkat1/club us-east-1

set -e

GITHUB_REPO="${1:-shafkat1/club}"
AWS_REGION="${2:-us-east-1}"
ROLE_NAME="github-oidc-terraform-role"
POLICY_NAME="github-oidc-terraform-policy"

echo "Setting up GitHub OIDC for repository: $GITHUB_REPO"
echo "AWS Region: $AWS_REGION"

# Create trust policy document
cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::\$(aws sts get-caller-identity --query Account --output text):oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${GITHUB_REPO}:*"
        }
      }
    }
  ]
}
EOF

# Create IAM role
echo "Creating IAM role..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Substitute account ID in trust policy
sed -i "s/\$(aws sts get-caller-identity --query Account --output text)/${ACCOUNT_ID}/g" /tmp/trust-policy.json

aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document file:///tmp/trust-policy.json \
  --region "$AWS_REGION" 2>/dev/null || echo "Role already exists"

# Attach Terraform policy
cat > /tmp/terraform-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "rds:*",
        "dynamodb:*",
        "elasticache:*",
        "s3:*",
        "cloudfront:*",
        "route53:*",
        "acm:*",
        "iam:*",
        "secretsmanager:*",
        "kms:*",
        "ecs:*",
        "elasticloadbalancing:*",
        "logs:*",
        "cloudformation:*"
      ],
      "Resource": "*"
    }
  ]
}
EOF

echo "Attaching Terraform policy..."
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "$POLICY_NAME" \
  --policy-document file:///tmp/terraform-policy.json \
  --region "$AWS_REGION"

# Output role ARN
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text --region "$AWS_REGION")

echo ""
echo "=========================================="
echo "GitHub OIDC setup complete!"
echo "=========================================="
echo ""
echo "Add this to your GitHub repository:"
echo ""
echo "1. Go to: https://github.com/${GITHUB_REPO}/settings/environments"
echo "2. Create environment 'development' (if not exists)"
echo "3. Add secret: AWS_ROLE_TO_ASSUME = $ROLE_ARN"
echo "4. Optional variables: PROJECT=clubapp, AWS_REGION=$AWS_REGION"
echo ""
echo "5. (Optional) For production:"
echo "   - Create environment 'production'"
echo "   - Add same secret and vars"
echo ""

rm -f /tmp/trust-policy.json /tmp/terraform-policy.json
