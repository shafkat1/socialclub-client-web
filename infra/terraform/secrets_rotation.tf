# Use AWS Serverless Application Repository rotation function
# App name: SecretsManagerRDSPostgreSQLRotationSingleUser
# Note: Manual rotation setup can be done via AWS Console after deployment

resource "aws_security_group" "rotation" {
  name        = "${local.name_prefix}-secrets-rotation-sg"
  description = "Allow rotation lambda to reach RDS"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound not required; lambda initiates outbound connections
}

# For production, use AWS Secrets Manager rotation via Lambda
# This can be set up manually in the AWS Console:
# 1. Go to Secrets Manager → clubapp-dev/rds/postgres/connection
# 2. Click "Set rotation" → "Enable rotation"
# 3. Select "SecretsManagerRDSPostgreSQLRotationSingleUser"
# 4. Configure Lambda execution role and VPC settings

# Create composite secret with connection info
resource "aws_secretsmanager_secret" "db_conn" {
  name       = "${local.name_prefix}/rds/postgres/connection"
  kms_key_id = aws_kms_key.main.arn
}

resource "aws_secretsmanager_secret_version" "db_conn_v" {
  secret_id = aws_secretsmanager_secret.db_conn.id
  secret_string = jsonencode({
    engine   = "postgres",
    host     = aws_db_instance.postgres.address,
    port     = aws_db_instance.postgres.port,
    username = aws_db_instance.postgres.username,
    password = random_password.rds_master.result,
    dbname   = "postgres"
  })
}

output "db_secret_arn" {
  value       = aws_secretsmanager_secret.db_conn.arn
  description = "Secrets Manager ARN with rotating DB credentials"
}
