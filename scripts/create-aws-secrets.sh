#!/bin/bash

################################################################################
# AWS Secrets Manager Setup Script
# Creates all required secrets for SocialClub CI/CD deployment
# Usage: ./create-aws-secrets.sh [aws-region]
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${1:-us-east-1}"
SECRET_PREFIX="socialclub"

# Function to print colored output
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Function to create a secret
create_secret() {
    local secret_name="$1"
    local secret_value="$2"
    local description="$3"
    
    echo -e "${YELLOW}Creating secret: $secret_name${NC}"
    
    if aws secretsmanager describe-secret \
        --secret-id "$secret_name" \
        --region "$AWS_REGION" \
        2>/dev/null; then
        
        print_info "Secret '$secret_name' already exists, updating..."
        aws secretsmanager update-secret \
            --secret-id "$secret_name" \
            --secret-string "$secret_value" \
            --region "$AWS_REGION" \
            --query 'ARN' \
            --output text
    else
        aws secretsmanager create-secret \
            --name "$secret_name" \
            --description "$description" \
            --secret-string "$secret_value" \
            --region "$AWS_REGION" \
            --query 'ARN' \
            --output text
    fi
    
    print_success "Secret '$secret_name' created/updated"
}

# Main script
main() {
    print_header "🔐 AWS SECRETS MANAGER SETUP"
    echo ""
    
    # Check AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity --region "$AWS_REGION" &> /dev/null; then
        print_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_success "AWS CLI configured correctly"
    print_info "Using region: $AWS_REGION"
    echo ""
    
    print_header "📋 AWS CONFIGURATION SECRETS"
    
    # AWS Secrets
    create_secret \
        "$SECRET_PREFIX/aws/role-arn" \
        "arn:aws:iam::ACCOUNT_ID:role/github-actions-role" \
        "GitHub Actions IAM role ARN for OIDC"
    
    create_secret \
        "$SECRET_PREFIX/aws/s3-staging-bucket" \
        "socialclub-frontend-staging" \
        "S3 bucket for staging frontend"
    
    create_secret \
        "$SECRET_PREFIX/aws/s3-production-bucket" \
        "socialclub-frontend-production" \
        "S3 bucket for production frontend"
    
    create_secret \
        "$SECRET_PREFIX/aws/cloudfront-staging-id" \
        "E1234567890ABC" \
        "CloudFront distribution ID for staging"
    
    create_secret \
        "$SECRET_PREFIX/aws/cloudfront-production-id" \
        "E0987654321XYZ" \
        "CloudFront distribution ID for production"
    
    create_secret \
        "$SECRET_PREFIX/aws/ecr-registry" \
        "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com" \
        "ECR registry URL"
    
    echo ""
    print_header "🌐 API CONFIGURATION SECRETS"
    
    # API Secrets
    create_secret \
        "$SECRET_PREFIX/api/vite-api-url" \
        "https://api-staging.socialclub.com" \
        "Backend API URL for frontend (staging)"
    
    create_secret \
        "$SECRET_PREFIX/api/backend-url" \
        "https://api-staging.socialclub.com" \
        "Backend health check URL"
    
    echo ""
    print_header "🐳 CONTAINER REGISTRY SECRET"
    
    # Container Registry Secret
    create_secret \
        "$SECRET_PREFIX/registry/username" \
        "github" \
        "Container registry username (GitHub)"
    
    echo ""
    print_header "🔗 INTEGRATION SECRETS"
    
    # Slack Secret
    create_secret \
        "$SECRET_PREFIX/integration/slack-webhook" \
        "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
        "Slack webhook for deployment notifications (optional)"
    
    # Snyk Secret
    create_secret \
        "$SECRET_PREFIX/integration/snyk-token" \
        "your-snyk-api-token" \
        "Snyk security scanning token (optional)"
    
    # CodeCov Secret
    create_secret \
        "$SECRET_PREFIX/integration/codecov-token" \
        "your-codecov-token" \
        "Codecov token for coverage reports (optional)"
    
    echo ""
    print_header "🗄️  DATABASE SECRETS"
    
    # Database Secrets
    create_secret \
        "$SECRET_PREFIX/database/database-url" \
        "postgresql://user:password@host:5432/dbname" \
        "PostgreSQL connection string"
    
    create_secret \
        "$SECRET_PREFIX/database/redis-url" \
        "redis://host:6379" \
        "Redis connection string"
    
    echo ""
    print_header "🐳 DOCKER REGISTRY SECRETS"
    
    # Docker Hub Secrets (Optional)
    create_secret \
        "$SECRET_PREFIX/docker/docker-username" \
        "your-docker-username" \
        "Docker Hub username (optional)"
    
    create_secret \
        "$SECRET_PREFIX/docker/docker-password" \
        "your-docker-password" \
        "Docker Hub password (optional)"
    
    echo ""
    print_header "✅ SECRETS CREATION COMPLETE"
    echo ""
    print_success "All 16 secrets have been created/updated in AWS Secrets Manager"
    echo ""
    
    print_header "📝 NEXT STEPS"
    echo ""
    echo "1. Update the secret values with your actual credentials:"
    echo "   - AWS IAM role ARN"
    echo "   - S3 bucket names"
    echo "   - CloudFront distribution IDs"
    echo "   - API URLs"
    echo "   - Database connection strings"
    echo "   - Slack webhook URL"
    echo "   - Integration tokens (Snyk, CodeCov)"
    echo ""
    echo "2. Update GitHub Actions secrets to reference these AWS Secrets:"
    echo "   - AWS_ROLE_ARN"
    echo "   - AWS_S3_STAGING_BUCKET"
    echo "   - AWS_S3_PRODUCTION_BUCKET"
    echo "   - AWS_CLOUDFRONT_STAGING_ID"
    echo "   - AWS_CLOUDFRONT_PRODUCTION_ID"
    echo "   - AWS_ECR_REGISTRY"
    echo "   - VITE_API_URL"
    echo "   - BACKEND_URL"
    echo "   - REGISTRY_USERNAME"
    echo "   - SLACK_WEBHOOK"
    echo "   - SNYK_TOKEN"
    echo "   - CODECOV_TOKEN"
    echo "   - DATABASE_URL"
    echo "   - REDIS_URL"
    echo ""
    echo "3. To list all created secrets:"
    echo "   aws secretsmanager list-secrets --region $AWS_REGION --filters Key=name,Values=$SECRET_PREFIX --query 'SecretList[*].[Name,Description]'"
    echo ""
    echo "4. To retrieve a secret value:"
    echo "   aws secretsmanager get-secret-value --secret-id <secret-name> --region $AWS_REGION --query 'SecretString' --output text"
    echo ""
}

# Run main function
main "$@"
