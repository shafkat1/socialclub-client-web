resource "aws_kms_key" "main" {
  description             = "KMS key for app secrets and buckets"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

# Secrets for DB credentials
resource "aws_secretsmanager_secret" "db_password" {
  name       = "${local.name_prefix}/rds/postgres/password"
  kms_key_id = aws_kms_key.main.arn
}

resource "aws_secretsmanager_secret_version" "db_password_v" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.rds_master.result
}

# ECS task execution role
resource "aws_iam_role" "ecs_task_execution" {
  name               = "${local.name_prefix}-ecs-task-exec"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "task_access" {
  name = "${local.name_prefix}-task-access"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      { "Effect": "Allow", "Action": ["secretsmanager:GetSecretValue"], "Resource": [aws_secretsmanager_secret.db_password.arn] },
      { "Effect": "Allow", "Action": ["kms:Decrypt"], "Resource": [aws_kms_key.main.arn] },
      { "Effect": "Allow", "Action": ["s3:GetObject", "s3:PutObject"], "Resource": [
          aws_s3_bucket.assets.arn,
          "${aws_s3_bucket.assets.arn}/*",
          aws_s3_bucket.receipts.arn,
          "${aws_s3_bucket.receipts.arn}/*"
        ] }
    ]
  })
}

data "aws_iam_policy_document" "ecs_tasks_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}
