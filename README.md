# Tuple - Data Intelligence Platform

<div align="center">
  <h3>Connect • Analyze • Insight</h3>
  <p>
    Transform your data into actionable insights with AI-powered analysis, 
    delivered directly to your team's communication tools.
  </p>
</div>

---

## ✨ Features

### 🔌 Universal Data Connectivity
Connect to virtually any data source:
- **Databases**: PostgreSQL, MySQL, MongoDB, SQLite
- **Cloud Warehouses**: Snowflake, BigQuery, Redshift
- **Files**: CSV, Excel, JSON
- **APIs**: REST API endpoints

### 🤖 AI-Powered Intelligence
- **Natural Language Queries**: Ask questions in plain English, get SQL results
- **Automatic Schema Analysis**: Understand your data structure instantly
- **Smart Insights**: AI-generated trends, anomalies, and recommendations
- **Confidence Scores**: Know how reliable each insight is

### 💬 Team Integrations
- **Slack**: Query data and receive insights directly in Slack
- **Microsoft Teams**: Get notifications and run queries via Teams

### 🎨 Modern, Intuitive UI
- Beautiful, responsive design
- Dark/light mode support
- Real-time query execution
- Interactive data exploration

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)
- Docker (optional, for containerized deployment)

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/Spectron-AI/tuple.git
cd tuple

# Copy environment file and configure
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Manual Setup

#### Backend (API)

```bash
cd apps/api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run the server
uvicorn app.main:app --reload
```

#### Frontend (Web)

```bash
cd apps/web

# Install dependencies
npm install

# Configure environment (optional)
cp .env.example .env.local

# Run the development server
npm run dev
```

---

## 📁 Project Structure

```
tuple/
├── apps/
│   ├── api/                 # Python FastAPI backend
│   │   ├── app/
│   │   │   ├── connectors/  # Data source connectors
│   │   │   ├── core/        # Configuration, security
│   │   │   ├── models/      # Pydantic schemas
│   │   │   ├── routers/     # API endpoints
│   │   │   ├── services/    # Business logic
│   │   │   └── main.py      # Application entry
│   │   └── requirements.txt
│   │
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   ├── app/         # Next.js pages
│       │   ├── components/  # React components
│       │   ├── lib/         # Utilities, stores
│       │   └── types/       # TypeScript types
│       └── package.json
│
├── infra/                   # Azure Bicep templates
│   ├── main.bicep           # Main infrastructure
│   └── modules/             # Modular resources
│
├── terraform/               # Multi-cloud Terraform
│   ├── main.tf              # Main configuration
│   └── modules/             # Azure, AWS, GCP modules
│
├── .github/workflows/       # CI/CD pipelines
├── docs/                    # Documentation
├── azure.yaml               # Azure Developer CLI config
├── docker-compose.yml       # Docker orchestration
└── README.md
```

---

## 🔧 Configuration

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `JWT_SECRET_KEY` | Secret key for JWT authentication |

### Optional Environment Variables

| Variable | Description |
|----------|-------------|
| `SLACK_BOT_TOKEN` | Slack bot token for integration |
| `SLACK_SIGNING_SECRET` | Slack app signing secret |
| `TEAMS_WEBHOOK_URL` | Microsoft Teams webhook URL |
| `REDIS_URL` | Redis URL for caching |

---

## 📚 API Documentation

Once the API is running, access the interactive documentation:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/datasources` | Create a data source connection |
| `POST /api/v1/datasources/{id}/nl-query` | Execute natural language query |
| `POST /api/v1/insights/generate` | Generate AI insights |
| `POST /api/v1/chat` | Chat with your data |
| `POST /api/v1/integrations/slack` | Set up Slack integration |
| `POST /api/v1/integrations/teams` | Set up Teams integration |

---

## ☁️ Deployment

Deploy Tuple to production on Azure, AWS, or GCP.

### Quick Deploy with Azure Developer CLI (azd)

```bash
# Login to Azure
azd auth login

# Set environment variables
azd env set OPENAI_API_KEY "your-key"

# Deploy everything
azd up
```

### Multi-Cloud with Terraform

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your settings

terraform init
terraform apply
```

### Supported Platforms

| Platform | Tool | Resources |
|----------|------|-----------|
| **Azure** | azd / Bicep | Container Apps, PostgreSQL, Redis, Key Vault |
| **AWS** | Terraform | ECS Fargate, RDS, ElastiCache, Secrets Manager |
| **GCP** | Terraform | Cloud Run, Cloud SQL, Memorystore, Secret Manager |

📖 See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete deployment instructions.

---

## 🛠 Development

### Running Tests

```bash
# Backend tests
cd apps/api
pytest

# Frontend tests
cd apps/web
npm test
```

### Code Quality

```bash
# Backend
cd apps/api
black app/
isort app/
mypy app/

# Frontend
cd apps/web
npm run lint
npm run format
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) for GPT models
- [Vercel](https://vercel.com) for Next.js
- [FastAPI](https://fastapi.tiangolo.com) for the Python framework
- [shadcn/ui](https://ui.shadcn.com) for UI components

---

<div align="center">
  <p>Built with ❤️ by Spectron AI</p>
</div>
