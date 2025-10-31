# Bootstrap: Create S3 backend bucket and DynamoDB lock table BEFORE initializing terraform backend
# This file is for reference; run the AWS CLI commands or Terraform separately first.
# 
# Option 1: AWS CLI
# aws s3api create-bucket --bucket clubapp-dev-tfstate --region us-east-1 --create-bucket-configuration LocationConstraint=us-east-1
# aws s3api put-bucket-versioning --bucket clubapp-dev-tfstate --versioning-configuration Status=Enabled
# aws s3api put-bucket-encryption --bucket clubapp-dev-tfstate --server-side-encryption-configuration '{
#   "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
# }'
# aws dynamodb create-table --table-name clubapp-dev-tfstate-lock \
#   --attribute-definitions AttributeName=LockID,AttributeType=S \
#   --key-schema AttributeName=LockID,KeyType=HASH \
#   --billing-mode PAY_PER_REQUEST --region us-east-1
#
# Option 2: Use the bootstrap Terraform below (in a separate workspace, then delete)
# After bootstrap, initialize with: terraform init
