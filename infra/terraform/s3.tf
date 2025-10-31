resource "aws_s3_bucket" "assets" {
  bucket = "${local.name_prefix}-assets"
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket                  = aws_s3_bucket.assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "assets" {
  bucket = aws_s3_bucket.assets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAC"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.assets.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.assets.id}"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.assets]
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket" "receipts" {
  bucket = "${local.name_prefix}-receipts"
}

resource "aws_s3_bucket_public_access_block" "receipts" {
  bucket                  = aws_s3_bucket.receipts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "receipts" {
  bucket = aws_s3_bucket.receipts.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket" "logs" {
  bucket = "${local.name_prefix}-logs"
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket                  = aws_s3_bucket.logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "expire-3y"
    status = "Enabled"

    filter {}

    expiration {
      days = 1095
    }
  }
}
