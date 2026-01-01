from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional

from app.models import (
    DataSourceCreate,
    DataSourceUpdate,
    DataSourceResponse,
    QueryRequest,
    NLQueryRequest,
    QueryResult,
    SampleDataRequest,
    SampleDataResponse,
    DatabaseSchema,
)
from app.services import get_data_source_service
from app.core.security import get_current_user

router = APIRouter(prefix="/datasources", tags=["Data Sources"])


@router.post("", response_model=DataSourceResponse, status_code=status.HTTP_201_CREATED)
async def create_data_source(
    data: DataSourceCreate,
    # user: dict = Depends(get_current_user),
):
    """Create a new data source connection."""
    try:
        service = get_data_source_service()
        return await service.create_data_source(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("", response_model=List[DataSourceResponse])
async def list_data_sources(
    # user: dict = Depends(get_current_user),
):
    """List all data sources."""
    service = get_data_source_service()
    return await service.list_data_sources()


@router.get("/{source_id}", response_model=DataSourceResponse)
async def get_data_source(
    source_id: str,
    # user: dict = Depends(get_current_user),
):
    """Get a data source by ID."""
    service = get_data_source_service()
    result = await service.get_data_source(source_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found")
    return result


@router.patch("/{source_id}", response_model=DataSourceResponse)
async def update_data_source(
    source_id: str,
    data: DataSourceUpdate,
    # user: dict = Depends(get_current_user),
):
    """Update a data source."""
    service = get_data_source_service()
    result = await service.update_data_source(source_id, data)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found")
    return result


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_data_source(
    source_id: str,
    # user: dict = Depends(get_current_user),
):
    """Delete a data source."""
    service = get_data_source_service()
    if not await service.delete_data_source(source_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found")


@router.post("/{source_id}/test")
async def test_connection(
    source_id: str,
    # user: dict = Depends(get_current_user),
):
    """Test the connection to a data source."""
    service = get_data_source_service()
    result = await service.test_connection(source_id)
    if not result["success"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["error"])
    return {"status": "connected"}


@router.post("/{source_id}/sync", response_model=DatabaseSchema)
async def sync_schema(
    source_id: str,
    # user: dict = Depends(get_current_user),
):
    """Sync the schema for a data source."""
    try:
        service = get_data_source_service()
        return await service.sync_schema(source_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/{source_id}/query", response_model=QueryResult)
async def execute_query(
    source_id: str,
    request: QueryRequest,
    # user: dict = Depends(get_current_user),
):
    """Execute a SQL query on a data source."""
    try:
        service = get_data_source_service()
        return await service.execute_query(
            source_id,
            request.query,
            request.limit,
            request.timeout,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=status.HTTP_408_REQUEST_TIMEOUT, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{source_id}/nl-query", response_model=QueryResult)
async def execute_nl_query(
    source_id: str,
    request: NLQueryRequest,
    # user: dict = Depends(get_current_user),
):
    """Execute a natural language query."""
    try:
        service = get_data_source_service()
        return await service.execute_nl_query(source_id, request.question)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{source_id}/sample", response_model=SampleDataResponse)
async def get_sample_data(
    source_id: str,
    request: SampleDataRequest,
    # user: dict = Depends(get_current_user),
):
    """Get sample data from a table."""
    try:
        service = get_data_source_service()
        return await service.get_sample_data(
            source_id,
            request.table_name,
            request.sample_size,
            request.random_sample,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
