terraform {
  backend "s3" {
    bucket         = "clubapp-dev-tfstate"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "clubapp-dev-tfstate-lock"
    encrypt        = true
  }
}
