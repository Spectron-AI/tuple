# Tuple API

Backend API for the Tuple Data Intelligence Platform.

## Features

- **Data Source Connectivity**: Connect to PostgreSQL, MySQL, MongoDB, CSV files, REST APIs, and more
- **AI-Powered Analysis**: Natural language to SQL conversion and intelligent data insights
- **Team Integrations**: Slack and Microsoft Teams notifications for data insights
- **Schema Intelligence**: Automatic schema detection and documentation

## Quick Start

### Prerequisites

- Python 3.11+
- pip or poetry

### Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy the environment file and configure:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Data Sources
- `POST /api/v1/datasources` - Create a new data source
- `GET /api/v1/datasources` - List all data sources
- `GET /api/v1/datasources/{id}` - Get a data source
- `PATCH /api/v1/datasources/{id}` - Update a data source
- `DELETE /api/v1/datasources/{id}` - Delete a data source
- `POST /api/v1/datasources/{id}/test` - Test connection
- `POST /api/v1/datasources/{id}/sync` - Sync schema
- `POST /api/v1/datasources/{id}/query` - Execute SQL query
- `POST /api/v1/datasources/{id}/nl-query` - Execute natural language query
- `POST /api/v1/datasources/{id}/sample` - Get sample data

### Insights
- `POST /api/v1/insights/generate` - Generate AI insights
- `GET /api/v1/insights` - List insights
- `GET /api/v1/insights/{id}` - Get an insight
- `POST /api/v1/insights/{id}/acknowledge` - Acknowledge insight
- `DELETE /api/v1/insights/{id}` - Delete insight

### Chat
- `POST /api/v1/chat` - Send a chat message
- `GET /api/v1/chat/conversations/{id}` - Get conversation history
- `DELETE /api/v1/chat/conversations/{id}` - Delete conversation
- `GET /api/v1/chat/suggestions/{data_source_id}` - Get suggested questions

### Integrations
- `POST /api/v1/integrations/slack` - Create Slack integration
- `GET /api/v1/integrations/slack` - List Slack integrations
- `POST /api/v1/integrations/teams` - Create Teams integration
- `GET /api/v1/integrations/teams` - List Teams integrations
- `GET /api/v1/integrations` - List all integrations

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black app/
isort app/
```

### Type Checking
```bash
mypy app/
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for LLM features | Required |
| `DATABASE_URL` | Internal database URL | `sqlite:///./tuple.db` |
| `REDIS_URL` | Redis URL for caching | `redis://localhost:6379` |
| `SLACK_BOT_TOKEN` | Slack bot token | Optional |
| `TEAMS_WEBHOOK_URL` | Teams webhook URL | Optional |
| `JWT_SECRET_KEY` | Secret key for JWT tokens | Required in production |

## License

MIT
