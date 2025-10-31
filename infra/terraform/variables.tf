variable "project" {
  description = "Short project slug for resource names and tags"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "az_count" {
  description = "Number of AZs to span"
  type        = number
  default     = 2
}

variable "vpc_cidr" {
  description = "CIDR for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "domain_name" {
  description = "Root domain (e.g., desh.co)"
  type        = string
  default     = "desh.co"
}

variable "enable_domain" {
  description = "Whether to create Route53 and ACM resources"
  type        = bool
  default     = false
}
