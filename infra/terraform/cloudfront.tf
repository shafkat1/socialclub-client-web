resource "aws_cloudfront_origin_access_control" "assets" {
  name                              = "${local.name_prefix}-oac-assets"
  description                       = "OAC for assets bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "assets" {
  enabled = true

  origin {
    domain_name              = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id                = "assets-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.assets.id
  }

  aliases = var.enable_domain ? ["assets.${var.domain_name}"] : []

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "assets-s3"

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.enable_domain ? false : true
    acm_certificate_arn            = var.enable_domain ? "arn:aws:acm:us-east-1:425687053209:certificate/8f2fbc6d-3ad2-4725-becb-04e25cc6979e" : null
    minimum_protocol_version       = var.enable_domain ? "TLSv1.2_2021" : "TLSv1"
    ssl_support_method             = var.enable_domain ? "sni-only" : null
  }

  depends_on = [aws_s3_bucket.assets]
}
