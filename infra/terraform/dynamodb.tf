resource "aws_dynamodb_table" "presence" {
  name           = "${local.name_prefix}-presence"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"
  range_key      = "venueId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "venueId"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  global_secondary_index {
    name            = "venue-index"
    hash_key        = "venueId"
    projection_type = "ALL"
  }

  tags = { Name = "${local.name_prefix}-presence" }
}

resource "aws_dynamodb_table" "venue_counts" {
  name         = "${local.name_prefix}-venue-counts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "venueId"

  attribute {
    name = "venueId"
    type = "S"
  }

  tags = { Name = "${local.name_prefix}-venue-counts" }
}

resource "aws_dynamodb_table" "idempotency" {
  name         = "${local.name_prefix}-idempotency"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "key"

  attribute {
    name = "key"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = { Name = "${local.name_prefix}-idempotency" }
}

resource "aws_dynamodb_table" "devices" {
  name         = "${local.name_prefix}-devices"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "deviceId"

  attribute {
    name = "deviceId"
    type = "S"
  }

  tags = { Name = "${local.name_prefix}-devices" }
}
