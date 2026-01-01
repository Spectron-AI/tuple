import json
import logging
from typing import Any, Dict, List, Optional
from openai import AsyncOpenAI

from app.core.config import settings
from app.models import (
    DatabaseSchema,
    TableSchema,
    InsightType,
    InsightSeverity,
    InsightMetric,
)

logger = logging.getLogger(__name__)


class LLMService:
    """Service for LLM-powered data intelligence."""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model
    
    async def natural_language_to_sql(
        self,
        question: str,
        schema: DatabaseSchema,
        dialect: str = "postgresql",
    ) -> Dict[str, str]:
        """
        Convert a natural language question to SQL query.
        Returns: {"sql": "...", "explanation": "..."}
        """
        # Build schema context
        schema_text = self._format_schema_for_prompt(schema)
        
        system_prompt = f"""You are a SQL expert. Convert natural language questions to SQL queries.

Database Schema:
{schema_text}

SQL Dialect: {dialect}

Rules:
1. Generate valid {dialect} SQL only
2. Use appropriate JOINs when needed
3. Include column aliases for clarity
4. Limit results to 100 rows unless specified otherwise
5. Handle NULL values appropriately
6. Use proper date/time functions for the dialect

Respond in JSON format:
{{"sql": "SELECT ...", "explanation": "Brief explanation of what the query does"}}"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question},
                ],
                temperature=0.1,
                response_format={"type": "json_object"},
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            logger.error(f"NL to SQL conversion failed: {e}")
            raise
    
    async def analyze_data_for_insights(
        self,
        schema: DatabaseSchema,
        sample_data: Dict[str, List[Dict]],
        focus_areas: Optional[List[str]] = None,
        max_insights: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Analyze data and generate intelligent insights.
        Returns a list of insight dictionaries.
        """
        schema_text = self._format_schema_for_prompt(schema)
        
        # Format sample data
        sample_text = ""
        for table_name, rows in sample_data.items():
            sample_text += f"\n{table_name} (sample of {len(rows)} rows):\n"
            if rows:
                sample_text += json.dumps(rows[:5], indent=2, default=str)
        
        focus_text = ""
        if focus_areas:
            focus_text = f"\nFocus areas: {', '.join(focus_areas)}"
        
        system_prompt = f"""You are a data analyst expert. Analyze the database schema and sample data to generate actionable business insights.

Database Schema:
{schema_text}

Sample Data:
{sample_text}
{focus_text}

Generate {max_insights} insights. For each insight, provide:
1. A clear, actionable title
2. A detailed description with specific observations
3. Type: trend, anomaly, correlation, recommendation, or summary
4. Severity: low, medium, high, or critical
5. Confidence score (0.0 to 1.0)
6. Relevant metrics with values
7. SQL query to validate/explore the insight

Respond in JSON format:
{{
  "insights": [
    {{
      "title": "...",
      "description": "...",
      "type": "trend|anomaly|correlation|recommendation|summary",
      "severity": "low|medium|high|critical",
      "confidence": 0.85,
      "metrics": [{{"name": "...", "value": ..., "change": ..., "unit": "..."}}],
      "sql_query": "SELECT ..."
    }}
  ]
}}"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": "Analyze this data and provide insights."},
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
            )
            
            result = json.loads(response.choices[0].message.content)
            return result.get("insights", [])
            
        except Exception as e:
            logger.error(f"Data analysis failed: {e}")
            raise
    
    async def explain_schema(self, schema: DatabaseSchema) -> Dict[str, Any]:
        """
        Generate an intelligent explanation of the database schema.
        """
        schema_text = self._format_schema_for_prompt(schema)
        
        system_prompt = f"""You are a database expert. Analyze the database schema and provide:
1. A high-level summary of what this database appears to be for
2. Identification of key entities and their relationships
3. Potential use cases
4. Data quality observations
5. Suggestions for optimization or additional indexes

Database Schema:
{schema_text}

Respond in JSON format:
{{
  "summary": "...",
  "purpose": "...",
  "entities": [{{"name": "...", "description": "...", "key_fields": ["..."]}}],
  "relationships": [{{"from": "...", "to": "...", "type": "...", "description": "..."}}],
  "use_cases": ["..."],
  "observations": ["..."],
  "recommendations": ["..."]
}}"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": "Explain this database schema."},
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            logger.error(f"Schema explanation failed: {e}")
            raise
    
    async def chat_with_data(
        self,
        message: str,
        schema: DatabaseSchema,
        conversation_history: List[Dict[str, str]],
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Have a conversation about the data.
        Returns response with optional SQL and explanation.
        """
        schema_text = self._format_schema_for_prompt(schema)
        
        context_text = f"\nAdditional context: {context}" if context else ""
        
        system_prompt = f"""You are a helpful data assistant. Help users understand and query their data.

Database Schema:
{schema_text}
{context_text}

You can:
1. Answer questions about the data
2. Generate SQL queries when needed
3. Explain data patterns and relationships
4. Suggest analyses and visualizations

When generating SQL, always validate it against the schema.

Respond in JSON format:
{{
  "message": "Your helpful response...",
  "sql_query": "SELECT ... (optional, only if user asks for data)",
  "suggestions": ["Optional follow-up questions or analyses"]
}}"""

        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history
        for msg in conversation_history[-10:]:  # Keep last 10 messages
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", ""),
            })
        
        messages.append({"role": "user", "content": message})
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,
                response_format={"type": "json_object"},
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            logger.error(f"Chat failed: {e}")
            raise
    
    async def generate_data_summary(
        self,
        table_name: str,
        columns: List[Dict[str, Any]],
        sample_data: List[Dict[str, Any]],
        statistics: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a summary of a specific table's data.
        """
        stats_text = ""
        if statistics:
            stats_text = f"\nStatistics:\n{json.dumps(statistics, indent=2, default=str)}"
        
        system_prompt = f"""Analyze this table data and provide a summary.

Table: {table_name}
Columns: {json.dumps(columns, indent=2)}

Sample Data:
{json.dumps(sample_data[:10], indent=2, default=str)}
{stats_text}

Provide:
1. What this table appears to store
2. Key observations about the data
3. Data quality notes
4. Suggested queries for analysis

Respond in JSON format:
{{
  "description": "...",
  "observations": ["..."],
  "data_quality": ["..."],
  "suggested_queries": [{{"description": "...", "sql": "..."}}]
}}"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": "Summarize this table."},
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            logger.error(f"Table summary generation failed: {e}")
            raise
    
    def _format_schema_for_prompt(self, schema: DatabaseSchema) -> str:
        """Format database schema for LLM prompt."""
        lines = []
        for table in schema.tables:
            lines.append(f"\nTable: {table.name}")
            if table.description:
                lines.append(f"  Description: {table.description}")
            if table.row_count is not None:
                lines.append(f"  Row count: {table.row_count:,}")
            lines.append("  Columns:")
            for col in table.columns:
                col_info = f"    - {col.name}: {col.type}"
                if col.primary_key:
                    col_info += " (PK)"
                if col.foreign_key:
                    col_info += f" -> {col.foreign_key}"
                if not col.nullable:
                    col_info += " NOT NULL"
                if col.description:
                    col_info += f" -- {col.description}"
                lines.append(col_info)
        
        return "\n".join(lines)


# Singleton instance
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """Get the LLM service singleton."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
