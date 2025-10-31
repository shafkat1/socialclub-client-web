resource "random_password" "rds_master" {
  length  = 24
  special = false
}

resource "aws_db_subnet_group" "rds" {
  name       = "${local.name_prefix}-rds-subnets"
  subnet_ids = [for s in aws_subnet.private : s.id]
  tags       = { Name = "${local.name_prefix}-rds-subnets" }
}

resource "aws_db_parameter_group" "postgres" {
  name        = "${local.name_prefix}-pg"
  family      = "postgres16"
  description = "Postgres params"

  parameter {
    name  = "log_statement"
    value = "none"
  }
}

resource "aws_db_instance" "postgres" {
  identifier                 = "${local.name_prefix}-postgres"
  engine                     = "postgres"
  engine_version             = "16.4"
  instance_class             = "db.t4g.medium"
  allocated_storage          = 100
  max_allocated_storage      = 512
  storage_encrypted          = true
  multi_az                   = true
  db_subnet_group_name       = aws_db_subnet_group.rds.name
  vpc_security_group_ids     = [aws_security_group.rds.id]
  username                   = "app"
  password                   = random_password.rds_master.result
  skip_final_snapshot        = true
  publicly_accessible        = false
  backup_retention_period    = 7
  deletion_protection        = false
  apply_immediately          = true
  auto_minor_version_upgrade = true
  parameter_group_name       = aws_db_parameter_group.postgres.name

  tags = { Name = "${local.name_prefix}-postgres" }
}
