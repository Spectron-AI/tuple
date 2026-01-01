# Tuple Infrastructure - Terraform
#
# This Terraform configuration supports deploying to:
# - Azure (Azure Container Apps)
# - AWS (ECS Fargate)
# - GCP (Cloud Run)
#
# Usage:
#   terraform init
#   terraform plan -var="cloud_provider=azure"
#   terraform apply -var="cloud_provider=azure"

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    # Azure
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"
    }
    # AWS
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.30"
    }
    # GCP
    google = {
      source  = "hashicorp/google"
      version = "~> 5.10"
    }
    # Shared
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Uncomment to use remote state
  # backend "azurerm" {
  #   resource_group_name  = "tfstate"
  #   storage_account_name = "tfstate"
  #   container_name       = "tfstate"
  #   key                  = "tuple.tfstate"
  # }
}

# Variables
variable "cloud_provider" {
  description = "Cloud provider to deploy to (azure, aws, gcp)"
  type        = string
  default     = "azure"

  validation {
    condition     = contains(["azure", "aws", "gcp"], var.cloud_provider)
    error_message = "cloud_provider must be one of: azure, aws, gcp"
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "tuple"
}

variable "location" {
  description = "Primary location/region for resources"
  type        = string
  default     = "eastus"
}

# Secrets
variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "jwt_secret_key" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "slack_bot_token" {
  description = "Slack bot token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "teams_webhook_url" {
  description = "Microsoft Teams webhook URL"
  type        = string
  sensitive   = true
  default     = ""
}

# Random suffix for unique naming
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# Local values
locals {
  resource_suffix = random_string.suffix.result
  common_tags = {
    project     = var.project_name
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Provider configurations
provider "azurerm" {
  features {}
  skip_provider_registration = true
}

provider "aws" {
  region = var.location == "eastus" ? "us-east-1" : var.location
}

provider "google" {
  project = "${var.project_name}-${var.environment}"
  region  = var.location == "eastus" ? "us-east1" : var.location
}

# Module selection based on cloud provider
module "azure" {
  source = "./modules/azure"
  count  = var.cloud_provider == "azure" ? 1 : 0

  environment       = var.environment
  project_name      = var.project_name
  location          = var.location
  resource_suffix   = local.resource_suffix
  tags              = local.common_tags
  openai_api_key    = var.openai_api_key
  jwt_secret_key    = var.jwt_secret_key
  slack_bot_token   = var.slack_bot_token
  teams_webhook_url = var.teams_webhook_url
}

module "aws" {
  source = "./modules/aws"
  count  = var.cloud_provider == "aws" ? 1 : 0

  environment       = var.environment
  project_name      = var.project_name
  region            = var.location == "eastus" ? "us-east-1" : var.location
  resource_suffix   = local.resource_suffix
  tags              = local.common_tags
  openai_api_key    = var.openai_api_key
  jwt_secret_key    = var.jwt_secret_key
  slack_bot_token   = var.slack_bot_token
  teams_webhook_url = var.teams_webhook_url
}

module "gcp" {
  source = "./modules/gcp"
  count  = var.cloud_provider == "gcp" ? 1 : 0

  environment       = var.environment
  project_name      = var.project_name
  region            = var.location == "eastus" ? "us-east1" : var.location
  resource_suffix   = local.resource_suffix
  labels            = local.common_tags
  openai_api_key    = var.openai_api_key
  jwt_secret_key    = var.jwt_secret_key
  slack_bot_token   = var.slack_bot_token
  teams_webhook_url = var.teams_webhook_url
}

# Outputs
output "web_url" {
  description = "URL of the web application"
  value = var.cloud_provider == "azure" ? (
    length(module.azure) > 0 ? module.azure[0].web_url : null
    ) : var.cloud_provider == "aws" ? (
    length(module.aws) > 0 ? module.aws[0].web_url : null
    ) : var.cloud_provider == "gcp" ? (
    length(module.gcp) > 0 ? module.gcp[0].web_url : null
  ) : null
}

output "api_url" {
  description = "URL of the API"
  value = var.cloud_provider == "azure" ? (
    length(module.azure) > 0 ? module.azure[0].api_url : null
    ) : var.cloud_provider == "aws" ? (
    length(module.aws) > 0 ? module.aws[0].api_url : null
    ) : var.cloud_provider == "gcp" ? (
    length(module.gcp) > 0 ? module.gcp[0].api_url : null
  ) : null
}

output "container_registry" {
  description = "Container registry URL"
  value = var.cloud_provider == "azure" ? (
    length(module.azure) > 0 ? module.azure[0].container_registry : null
    ) : var.cloud_provider == "aws" ? (
    length(module.aws) > 0 ? module.aws[0].container_registry : null
    ) : var.cloud_provider == "gcp" ? (
    length(module.gcp) > 0 ? module.gcp[0].container_registry : null
  ) : null
}
