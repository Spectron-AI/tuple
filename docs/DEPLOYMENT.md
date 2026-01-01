# Deployment Guide

This guide covers deploying Tuple to Azure, AWS, or GCP using either Azure Developer CLI (azd) or Terraform.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start: Azure with azd](#quick-start-azure-with-azd)
- [Cross-Cloud: Terraform](#cross-cloud-terraform)
- [CI/CD: GitHub Actions](#cicd-github-actions)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)

---

## Prerequisites

### General Requirements

- Docker Desktop (for building container images)
- Git

### For Azure Developer CLI (azd)

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- [Azure Developer CLI (azd)](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd)
- Azure subscription

### For Terraform

- [Terraform >= 1.5](https://www.terraform.io/downloads)
- Cloud provider CLI:
  - Azure: [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
  - AWS: [AWS CLI](https://aws.amazon.com/cli/)
  - GCP: [gcloud CLI](https://cloud.google.com/sdk/docs/install)

---

## Quick Start: Azure with azd

Azure Developer CLI (azd) provides the fastest path to deploy Tuple on Azure.

### 1. Authenticate

```bash
# Login to Azure
azd auth login

# Or use a service principal
azd auth login --client-id <client-id> --client-secret <client-secret> --tenant-id <tenant-id>
```

### 2. Initialize and Deploy

```bash
# Navigate to the project root
cd tuple

# Initialize the environment (first time only)
azd init

# Set required environment variables
azd env set OPENAI_API_KEY "your-openai-api-key"
azd env set JWT_SECRET_KEY "your-jwt-secret"
azd env set SLACK_BOT_TOKEN "your-slack-token"          # Optional
azd env set TEAMS_WEBHOOK_URL "your-teams-webhook"      # Optional

# Provision infrastructure and deploy
azd up
```

### 3. View Deployed Services

```bash
# Show deployment outputs
azd show

# Open the web application
azd open web
```

### 4. Update Deployment

```bash
# Deploy code changes only (no infrastructure changes)
azd deploy

# Update infrastructure and deploy
azd up
```

### 5. Cleanup

```bash
# Delete all resources
azd down
```

---

## Cross-Cloud: Terraform

Terraform enables deployment to Azure, AWS, or GCP with a consistent workflow.

### Setup

```bash
cd terraform

# Copy the example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
vim terraform.tfvars
```

### Deploy to Azure

```bash
# Login to Azure
az login

# Set cloud provider
# In terraform.tfvars:
# cloud_provider = "azure"

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply
```

### Deploy to AWS

```bash
# Configure AWS credentials
aws configure

# Set cloud provider
# In terraform.tfvars:
# cloud_provider = "aws"

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply
```

### Deploy to GCP

```bash
# Login to GCP
gcloud auth application-default login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Set cloud provider
# In terraform.tfvars:
# cloud_provider = "gcp"
# gcp_project_id = "your-project-id"

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply
```

### View Outputs

```bash
terraform output
```

### Cleanup

```bash
terraform destroy
```

---

## CI/CD: GitHub Actions

The repository includes GitHub Actions workflows for automated CI/CD.

### Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `ci.yml` | Push, PR | Runs linting, tests, and security scans |
| `azure-deploy.yml` | Manual, Main branch | Deploys to Azure using azd |

### Setup GitHub Actions for Azure

1. **Create Azure Service Principal**

```bash
az ad sp create-for-rbac \
  --name "tuple-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id} \
  --sdk-auth
```

2. **Add GitHub Secrets**

Navigate to your repository → Settings → Secrets and variables → Actions:

| Secret | Description |
|--------|-------------|
| `AZURE_CREDENTIALS` | JSON output from service principal creation |
| `OPENAI_API_KEY` | OpenAI API key |
| `JWT_SECRET_KEY` | JWT secret for authentication |
| `SLACK_BOT_TOKEN` | Slack integration token (optional) |
| `TEAMS_WEBHOOK_URL` | Teams webhook URL (optional) |

3. **Configure Federated Credentials (Recommended)**

For better security, use federated credentials instead of client secrets:

```bash
# Create the identity
az identity create \
  --name "tuple-github-actions" \
  --resource-group "your-resource-group"

# Add federated credential
az identity federated-credential create \
  --name "github-oidc" \
  --identity-name "tuple-github-actions" \
  --resource-group "your-resource-group" \
  --issuer "https://token.actions.githubusercontent.com" \
  --subject "repo:Spectron-AI/tuple:ref:refs/heads/main" \
  --audiences "api://AzureADTokenExchange"
```

Then set these secrets:
- `AZURE_CLIENT_ID`: Client ID of the managed identity
- `AZURE_TENANT_ID`: Azure AD tenant ID
- `AZURE_SUBSCRIPTION_ID`: Azure subscription ID

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for LLM features |
| `DATABASE_URL` | PostgreSQL connection string (auto-configured) |
| `REDIS_URL` | Redis connection string (auto-configured) |

### Optional

| Variable | Description |
|----------|-------------|
| `JWT_SECRET_KEY` | Secret for JWT token signing |
| `SLACK_BOT_TOKEN` | Slack Bot OAuth token |
| `SLACK_SIGNING_SECRET` | Slack app signing secret |
| `TEAMS_WEBHOOK_URL` | Microsoft Teams incoming webhook URL |
| `DEBUG` | Enable debug mode (default: false) |

---

## Post-Deployment

### Verify Deployment

1. **Check API Health**

```bash
curl https://your-api-url/health
```

2. **Access Web Application**

Open the web URL in your browser.

### Database Migrations

If using database migrations, run them after deployment:

```bash
# For Azure Container Apps
az containerapp exec \
  --name api-tuple \
  --resource-group rg-tuple-production \
  --command "alembic upgrade head"
```

### Configure Data Sources

1. Navigate to Settings → Data Sources
2. Add your database connections
3. Test connectivity

### Set Up Integrations

1. **Slack**: Configure OAuth callback URL to `https://your-api-url/api/integrations/slack/oauth/callback`
2. **Teams**: Create an incoming webhook in Teams and add the URL to environment variables

---

## Architecture

### Azure (azd / Bicep)

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure Container Apps                      │
├─────────────────────┬───────────────────────────────────────┤
│    Web (Next.js)    │         API (FastAPI)                 │
│    Port 3000        │         Port 8000                     │
└─────────────────────┴───────────────────────────────────────┘
          │                           │
          │                           ├──── Azure Redis Cache
          │                           ├──── Azure PostgreSQL
          │                           └──── Azure Key Vault
          │
          └──── Azure Container Registry
```

### AWS (Terraform)

```
┌─────────────────────────────────────────────────────────────┐
│              Application Load Balancer                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                    ECS Fargate Cluster                       │
├─────────────────────┬───────────────────────────────────────┤
│    Web Service      │         API Service                   │
│    (Next.js)        │         (FastAPI)                     │
└─────────────────────┴───────────────────────────────────────┘
          │                           │
          │                           ├──── ElastiCache Redis
          │                           ├──── RDS PostgreSQL
          │                           └──── Secrets Manager
          │
          └──── ECR (Container Registry)
```

### GCP (Terraform)

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloud Run                               │
├─────────────────────┬───────────────────────────────────────┤
│    Web Service      │         API Service                   │
│    (Next.js)        │         (FastAPI)                     │
└─────────────────────┴───────────────────────────────────────┘
          │                           │
          │                           ├──── Memorystore Redis
          │                           ├──── Cloud SQL PostgreSQL
          │                           └──── Secret Manager
          │
          └──── Artifact Registry
```

---

## Troubleshooting

### Common Issues

**1. Container fails to start**
- Check container logs: `az containerapp logs show -n <app-name> -g <resource-group>`
- Verify environment variables are set correctly

**2. Database connection errors**
- Ensure firewall rules allow connections
- Verify connection string format

**3. Build failures**
- Check Docker build locally: `docker build -t tuple-api ./backend`
- Ensure all dependencies are in requirements.txt or package.json

### Getting Help

- Check the [GitHub Issues](https://github.com/Spectron-AI/tuple/issues)
- Review Azure Container Apps [documentation](https://learn.microsoft.com/en-us/azure/container-apps/)
- See Terraform provider docs for your cloud platform

---

## Cost Optimization

### Development/Testing

- Use consumption-based pricing (Container Apps, Cloud Run)
- Scale to 0 when idle
- Use smaller database tiers

### Production

- Enable auto-scaling with appropriate min/max replicas
- Use reserved capacity for predictable workloads
- Monitor and right-size resources

---

## Security Best Practices

1. **Use managed identities** instead of connection strings where possible
2. **Store secrets** in Key Vault, Secrets Manager, or Secret Manager
3. **Enable HTTPS** for all public endpoints
4. **Restrict network access** using private endpoints
5. **Enable audit logging** for compliance
6. **Rotate secrets** regularly using automated pipelines
