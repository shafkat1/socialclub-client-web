locals {
  assets_domain = "assets.${var.domain_name}"
  api_domain    = "api.${var.domain_name}"
}

# CloudFront certificate must be in us-east-1 (always created)
resource "aws_acm_certificate" "cloudfront" {
  provider              = aws.us_east_1
  domain_name           = local.assets_domain
  validation_method     = "DNS"
  lifecycle { create_before_destroy = true }
  tags = { Name = "${local.name_prefix}-cf-cert" }
}

# ALB certificate in workload region (always created)
resource "aws_acm_certificate" "alb" {
  domain_name       = local.api_domain
  validation_method = "DNS"
  lifecycle { create_before_destroy = true }
  tags = { Name = "${local.name_prefix}-alb-cert" }
}

# DNS validation records in Route 53 (only if enable_domain=true)
resource "aws_route53_record" "cloudfront_cert_validation" {
  count   = var.enable_domain ? length(tolist(aws_acm_certificate.cloudfront.domain_validation_options)) : 0
  name    = tolist(aws_acm_certificate.cloudfront.domain_validation_options)[count.index].resource_record_name
  type    = tolist(aws_acm_certificate.cloudfront.domain_validation_options)[count.index].resource_record_type
  zone_id = aws_route53_zone.primary[0].zone_id
  records = [tolist(aws_acm_certificate.cloudfront.domain_validation_options)[count.index].resource_record_value]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "cloudfront" {
  count                   = var.enable_domain ? 1 : 0
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cloudfront.arn
  validation_record_fqdns = [for r in aws_route53_record.cloudfront_cert_validation : r.fqdn]
}

resource "aws_route53_record" "alb_cert_validation" {
  count   = var.enable_domain ? length(tolist(aws_acm_certificate.alb.domain_validation_options)) : 0
  name    = tolist(aws_acm_certificate.alb.domain_validation_options)[count.index].resource_record_name
  type    = tolist(aws_acm_certificate.alb.domain_validation_options)[count.index].resource_record_type
  zone_id = aws_route53_zone.primary[0].zone_id
  records = [tolist(aws_acm_certificate.alb.domain_validation_options)[count.index].resource_record_value]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "alb" {
  count                   = var.enable_domain ? 1 : 0
  certificate_arn         = aws_acm_certificate.alb.arn
  validation_record_fqdns = [for r in aws_route53_record.alb_cert_validation : r.fqdn]
}

# Output validation CNAMEs for GoDaddy (manual DNS validation)
output "acm_validation_cnames" {
  value = {
    assets = {
      domain = local.assets_domain
      records = [
        for dvo in aws_acm_certificate.cloudfront.domain_validation_options : {
          name  = dvo.resource_record_name
          value = dvo.resource_record_value
        }
      ]
    }
    api = {
      domain = local.api_domain
      records = [
        for dvo in aws_acm_certificate.alb.domain_validation_options : {
          name  = dvo.resource_record_name
          value = dvo.resource_record_value
        }
      ]
    }
  }
  description = "ACM validation CNAMEs to add to GoDaddy DNS"
}
