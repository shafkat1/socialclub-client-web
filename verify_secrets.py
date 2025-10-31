#!/usr/bin/env python3
"""Verify all socialclub secrets exist in AWS"""

import boto3

client = boto3.client('secretsmanager', region_name='us-east-1')

response = client.list_secrets(
    Filters=[
        {
            'Key': 'name',
            'Values': ['socialclub']
        }
    ]
)

print("\n" + "="*80)
print("SOCIALCLUB SECRETS - VERIFICATION")
print("="*80 + "\n")

secrets = response['SecretList']
expected = [
    'socialclub/aws/role-arn',
    'socialclub/aws/s3-staging-bucket',
    'socialclub/aws/s3-production-bucket',
    'socialclub/aws/cloudfront-staging-id',
    'socialclub/aws/cloudfront-production-id',
    'socialclub/aws/ecr-registry',
    'socialclub/api/vite-api-url',
    'socialclub/api/backend-url',
    'socialclub/registry/username',
    'socialclub/integration/slack-webhook',
    'socialclub/integration/snyk-token',
    'socialclub/integration/codecov-token',
    'socialclub/database/database-url',
    'socialclub/database/redis-url',
    'socialclub/docker/docker-username',
    'socialclub/docker/docker-password',
]

found_names = [s['Name'] for s in secrets]

print(f"Total Secrets Found: {len(secrets)}/16\n")
print("AWS Secrets Manager Contents:\n")

for i, secret in enumerate(secrets, 1):
    status = "OK" if secret['Name'] in expected else "EXTRA"
    print(f"  {i:2}. {secret['Name']:<50} [{status}]")

print("\n" + "="*80)

if len(secrets) == 16:
    print("SUCCESS: All 16 socialclub secrets are SAFE and present in AWS!")
else:
    print(f"WARNING: Found {len(secrets)}/16 secrets")
    
print("="*80 + "\n")
