resource "aws_route53_zone" "primary" {
  count = var.enable_domain ? 1 : 0
  name  = var.domain_name
}

# Alias records for CloudFront and ALB (only if enable_domain=true)
resource "aws_route53_record" "assets" {
  count   = var.enable_domain ? 1 : 0
  zone_id = aws_route53_zone.primary[0].zone_id
  name    = "assets.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.assets.domain_name
    zone_id                = aws_cloudfront_distribution.assets.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "api" {
  count   = var.enable_domain ? 1 : 0
  zone_id = aws_route53_zone.primary[0].zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.app.dns_name
    zone_id                = aws_lb.app.zone_id
    evaluate_target_health = true
  }
}

output "route53_name_servers" {
  value       = var.enable_domain ? aws_route53_zone.primary[0].name_servers : []
  description = "Name servers to configure at the domain registrar (GoDaddy) if using Route 53 DNS."
}
