targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment that can be used as part of naming resource convention')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@description('Name of the resource group')
param resourceGroupName string = ''

@description('OpenAI API Key for LLM features')
@secure()
param openAiApiKey string = ''

@description('JWT Secret Key for authentication')
@secure()
param jwtSecretKey string = ''

@description('Slack Bot Token for Slack integration')
@secure()
param slackBotToken string = ''

@description('Slack Signing Secret')
@secure()
param slackSigningSecret string = ''

@description('Teams Webhook URL for Microsoft Teams integration')
@secure()
param teamsWebhookUrl string = ''

// Tags that should be applied to all resources
var tags = {
  'azd-env-name': environmentName
  application: 'tuple'
  environment: environmentName
}

// Generate a unique token for resource naming
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))

// Resource group
resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: !empty(resourceGroupName) ? resourceGroupName : 'rg-${environmentName}'
  location: location
  tags: tags
}

// Container Apps Environment and supporting resources
module containerAppsEnvironment 'modules/container-apps-environment.bicep' = {
  name: 'container-apps-environment'
  scope: rg
  params: {
    name: 'cae-${resourceToken}'
    location: location
    tags: tags
    logAnalyticsWorkspaceName: 'log-${resourceToken}'
  }
}

// Azure Container Registry
module containerRegistry 'modules/container-registry.bicep' = {
  name: 'container-registry'
  scope: rg
  params: {
    name: 'cr${resourceToken}'
    location: location
    tags: tags
  }
}

// Azure Cache for Redis
module redis 'modules/redis.bicep' = {
  name: 'redis'
  scope: rg
  params: {
    name: 'redis-${resourceToken}'
    location: location
    tags: tags
  }
}

// Azure Database for PostgreSQL
module postgresql 'modules/postgresql.bicep' = {
  name: 'postgresql'
  scope: rg
  params: {
    name: 'psql-${resourceToken}'
    location: location
    tags: tags
    administratorLogin: 'tupleadmin'
    databaseName: 'tuple'
  }
}

// Key Vault for secrets
module keyVault 'modules/keyvault.bicep' = {
  name: 'keyvault'
  scope: rg
  params: {
    name: 'kv-${resourceToken}'
    location: location
    tags: tags
    secrets: [
      {
        name: 'openai-api-key'
        value: openAiApiKey
      }
      {
        name: 'jwt-secret-key'
        value: !empty(jwtSecretKey) ? jwtSecretKey : 'default-secret-change-in-production-${resourceToken}'
      }
      {
        name: 'slack-bot-token'
        value: slackBotToken
      }
      {
        name: 'slack-signing-secret'
        value: slackSigningSecret
      }
      {
        name: 'teams-webhook-url'
        value: teamsWebhookUrl
      }
      {
        name: 'database-url'
        value: postgresql.outputs.connectionString
      }
      {
        name: 'redis-url'
        value: redis.outputs.connectionString
      }
    ]
  }
}

// API Container App
module apiContainerApp 'modules/container-app.bicep' = {
  name: 'api-container-app'
  scope: rg
  params: {
    name: 'api-${resourceToken}'
    location: location
    tags: union(tags, { 'azd-service-name': 'api' })
    containerAppsEnvironmentId: containerAppsEnvironment.outputs.id
    containerRegistryName: containerRegistry.outputs.name
    imageName: 'tuple-api:latest'
    targetPort: 8000
    external: true
    env: [
      {
        name: 'ENVIRONMENT'
        value: 'production'
      }
      {
        name: 'DEBUG'
        value: 'false'
      }
      {
        name: 'CORS_ORIGINS'
        value: 'https://${webContainerApp.outputs.fqdn}'
      }
    ]
    secrets: [
      {
        name: 'openai-api-key'
        keyVaultUrl: '${keyVault.outputs.endpoint}secrets/openai-api-key'
        identity: 'system'
      }
      {
        name: 'jwt-secret-key'
        keyVaultUrl: '${keyVault.outputs.endpoint}secrets/jwt-secret-key'
        identity: 'system'
      }
      {
        name: 'database-url'
        keyVaultUrl: '${keyVault.outputs.endpoint}secrets/database-url'
        identity: 'system'
      }
      {
        name: 'redis-url'
        keyVaultUrl: '${keyVault.outputs.endpoint}secrets/redis-url'
        identity: 'system'
      }
      {
        name: 'slack-bot-token'
        keyVaultUrl: '${keyVault.outputs.endpoint}secrets/slack-bot-token'
        identity: 'system'
      }
      {
        name: 'teams-webhook-url'
        keyVaultUrl: '${keyVault.outputs.endpoint}secrets/teams-webhook-url'
        identity: 'system'
      }
    ]
  }
}

// Web Container App
module webContainerApp 'modules/container-app.bicep' = {
  name: 'web-container-app'
  scope: rg
  params: {
    name: 'web-${resourceToken}'
    location: location
    tags: union(tags, { 'azd-service-name': 'web' })
    containerAppsEnvironmentId: containerAppsEnvironment.outputs.id
    containerRegistryName: containerRegistry.outputs.name
    imageName: 'tuple-web:latest'
    targetPort: 3000
    external: true
    env: [
      {
        name: 'NODE_ENV'
        value: 'production'
      }
      {
        name: 'NEXT_PUBLIC_API_URL'
        value: 'https://${apiContainerApp.outputs.fqdn}'
      }
    ]
    secrets: []
  }
}

// Outputs for azd
output AZURE_LOCATION string = location
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.outputs.loginServer
output AZURE_CONTAINER_REGISTRY_NAME string = containerRegistry.outputs.name
output AZURE_KEY_VAULT_NAME string = keyVault.outputs.name
output AZURE_KEY_VAULT_ENDPOINT string = keyVault.outputs.endpoint
output SERVICE_API_ENDPOINT_URL string = 'https://${apiContainerApp.outputs.fqdn}'
output SERVICE_WEB_ENDPOINT_URL string = 'https://${webContainerApp.outputs.fqdn}'
output AZURE_RESOURCE_GROUP string = rg.name
