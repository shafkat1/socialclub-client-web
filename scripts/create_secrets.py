#!/usr/bin/env python3
"""
AWS Secrets Manager Creation Script
Creates all 16 required secrets for SocialClub deployment
"""

import boto3
import sys

def main():
    # Initialize Secrets Manager client
    client = boto3.client('secretsmanager', region_name='us-east-1')
    
    # Define all 16 secrets
    secrets = {
        'socialclub/aws/role-arn': {
            'value': 'arn:aws:iam::425687053209:role/github-actions-role',
            'description': 'GitHub Actions IAM role ARN for OIDC'
        },
        'socialclub/aws/s3-staging-bucket': {
            'value': 'socialclub-frontend-staging',
            'description': 'S3 bucket for staging frontend'
        },
        'socialclub/aws/s3-production-bucket': {
            'value': 'socialclub-frontend-production',
            'description': 'S3 bucket for production frontend'
        },
        'socialclub/aws/cloudfront-staging-id': {
            'value': 'E1234567890ABC',
            'description': 'CloudFront distribution ID for staging'
        },
        'socialclub/aws/cloudfront-production-id': {
            'value': 'E0987654321XYZ',
            'description': 'CloudFront distribution ID for production'
        },
        'socialclub/aws/ecr-registry': {
            'value': '425687053209.dkr.ecr.us-east-1.amazonaws.com',
            'description': 'ECR registry URL'
        },
        'socialclub/api/vite-api-url': {
            'value': 'https://api-staging.socialclub.com',
            'description': 'Backend API URL for frontend (staging)'
        },
        'socialclub/api/backend-url': {
            'value': 'https://api-staging.socialclub.com',
            'description': 'Backend health check URL'
        },
        'socialclub/registry/username': {
            'value': 'github',
            'description': 'GitHub container registry username'
        },
        'socialclub/integration/slack-webhook': {
            'value': 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
            'description': 'Slack webhook for deployment notifications (optional)'
        },
        'socialclub/integration/snyk-token': {
            'value': 'your-snyk-api-token',
            'description': 'Snyk security scanning token (optional)'
        },
        'socialclub/integration/codecov-token': {
            'value': 'your-codecov-token',
            'description': 'Codecov token for coverage reports (optional)'
        },
        'socialclub/database/database-url': {
            'value': 'postgresql://user:password@host:5432/dbname',
            'description': 'PostgreSQL connection string'
        },
        'socialclub/database/redis-url': {
            'value': 'redis://host:6379',
            'description': 'Redis connection string'
        },
        'socialclub/docker/docker-username': {
            'value': 'your-docker-username',
            'description': 'Docker Hub username (optional)'
        },
        'socialclub/docker/docker-password': {
            'value': 'your-docker-password',
            'description': 'Docker Hub password (optional)'
        }
    }
    
    print("\n" + "=" * 88)
    print("AWS SECRETS MANAGER CREATION")
    print("=" * 88 + "\n")
    
    created = 0
    updated = 0
    failed = 0
    
    for secret_name, secret_config in secrets.items():
        try:
            # Try to get the secret first
            try:
                client.describe_secret(SecretId=secret_name)
                # Secret exists, update it
                client.update_secret(
                    SecretId=secret_name,
                    SecretString=secret_config['value']
                )
                print("[UPDATE] " + secret_name)
                updated += 1
            except client.exceptions.ResourceNotFoundException:
                # Secret doesn't exist, create it
                client.create_secret(
                    Name=secret_name,
                    Description=secret_config['description'],
                    SecretString=secret_config['value']
                )
                print("[CREATE] " + secret_name)
                created += 1
        except Exception as e:
            print("[FAILED] " + secret_name + " - " + str(e))
            failed += 1
    
    print("\n" + "=" * 88)
    print("SECRETS CREATION COMPLETE")
    print("=" * 88)
    print("\nResults:")
    print("  Created: " + str(created))
    print("  Updated: " + str(updated))
    print("  Failed: " + str(failed))
    print("\nNext Steps:")
    print("1. Update all placeholder values with your actual AWS resource IDs")
    print("2. Go to AWS Secrets Manager console to edit each secret")
    print("3. Add secrets to GitHub Actions repository settings")
    print("\n")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\nCancelled by user")
        sys.exit(1)
    except Exception as e:
        print("\nError: " + str(e))
        sys.exit(1)
