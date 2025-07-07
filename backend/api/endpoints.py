"""
API endpoints for the Chat Bot App.

This module defines all API routes and endpoint handlers for the FastAPI application.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
import logging

from models.schemas import (
    SchemaParseRequest,
    SchemaParseResponse,
    ChatRequest,
    ChatResponse,
    APIForwardRequest,
    APIForwardResponse
)
from services.schema_parser import SchemaParserService
from services.openai_service import OpenAIService
from services.api_gateway import APIGatewayService
from core.exceptions import (
    SchemaParsingError,
    OpenAIServiceError,
    APIGatewayError,
    schema_parsing_http_exception,
    openai_service_http_exception,
    api_gateway_http_exception
)


# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()


# Dependency injection
def get_schema_parser_service() -> SchemaParserService:
    """Get SchemaParserService instance."""
    return SchemaParserService()


def get_openai_service() -> OpenAIService:
    """Get OpenAIService instance."""
    return OpenAIService()


def get_api_gateway_service() -> APIGatewayService:
    """Get APIGatewayService instance."""
    return APIGatewayService()


@router.post("/parse-schema", response_model=SchemaParseResponse)
async def parse_schema(
    request: SchemaParseRequest,
    schema_parser: SchemaParserService = Depends(get_schema_parser_service)
) -> SchemaParseResponse:
    """
    Parse a Pydantic BaseModel schema and convert it to UI-friendly format.
    
    Args:
        request: Schema parsing request containing the BaseModel definition
        schema_parser: Schema parser service instance
    
    Returns:
        SchemaParseResponse with parsed schema information
    
    Raises:
        HTTPException: If schema parsing fails
    """
    try:
        logger.info(f"Parsing schema: {request.model_name}")
        
        # Parse the schema
        parsed_schema = await schema_parser.parse_schema(
            model_definition=request.model_definition,
            model_name=request.model_name
        )
        
        return SchemaParseResponse(
            model_name=request.model_name,
            schema_data=parsed_schema,
            success=True
        )
        
    except SchemaParsingError as e:
        logger.error(f"Schema parsing failed: {e.message}")
        raise schema_parsing_http_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error during schema parsing: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during schema parsing: {str(e)}"
        )


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    openai_service: OpenAIService = Depends(get_openai_service)
) -> ChatResponse:
    """
    Process user input through OpenAI and convert to structured data.
    
    Args:
        request: Chat request containing user message and schema information
        openai_service: OpenAI service instance
    
    Returns:
        ChatResponse with AI response and structured data
    
    Raises:
        HTTPException: If OpenAI service fails
    """
    try:
        logger.info(f"Processing chat request for model: {request.target_model}")
        
        # Process the chat request
        response = await openai_service.process_chat(
            user_message=request.message,
            target_schema=request.target_schema,
            conversation_history=request.conversation_history,
            current_data=request.current_data
        )
        
        return ChatResponse(
            message=response.message,
            structured_data=response.structured_data,
            is_complete=response.is_complete,
            follow_up_questions=response.follow_up_questions,
            conversation_id=response.conversation_id
        )
        
    except OpenAIServiceError as e:
        logger.error(f"OpenAI service error: {e.message}")
        raise openai_service_http_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error during chat processing: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during chat processing: {str(e)}"
        )


@router.post("/forward", response_model=APIForwardResponse)
async def forward_to_api(
    request: APIForwardRequest,
    api_gateway: APIGatewayService = Depends(get_api_gateway_service)
) -> APIForwardResponse:
    """
    Forward completed BaseModel data to external API and return results.
    
    Args:
        request: API forward request containing data and endpoint information
        api_gateway: API gateway service instance
    
    Returns:
        APIForwardResponse with external API results
    
    Raises:
        HTTPException: If API forwarding fails
    """
    try:
        logger.info(f"Forwarding request to: {request.api_url}")
        
        # Forward the request
        response = await api_gateway.forward_request(
            api_url=request.api_url,
            method=request.method,
            data=request.data,
            headers=request.headers,
            timeout=request.timeout
        )
        
        return APIForwardResponse(
            success=True,
            status_code=response.status_code,
            response_data=response.data,
            response_headers=response.headers,
            execution_time=response.execution_time
        )
        
    except APIGatewayError as e:
        logger.error(f"API gateway error: {e.message}")
        raise api_gateway_http_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error during API forwarding: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during API forwarding: {str(e)}"
        )


@router.get("/schemas", response_model=List[str])
async def list_available_schemas(
    schema_parser: SchemaParserService = Depends(get_schema_parser_service)
) -> List[str]:
    """
    List all available schema templates.
    
    Args:
        schema_parser: Schema parser service instance
    
    Returns:
        List of available schema names
    """
    try:
        logger.info("Listing available schemas")
        return await schema_parser.list_available_schemas()
        
    except Exception as e:
        logger.error(f"Error listing schemas: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error listing schemas: {str(e)}"
        )


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint for the API.
    
    Returns:
        Dict containing health status and service information
    """
    return {
        "status": "healthy",
        "service": "Chat Bot App API",
        "version": "1.0.0",
        "endpoints": {
            "parse_schema": "/api/v1/parse-schema",
            "chat": "/api/v1/chat",
            "forward": "/api/v1/forward",
            "schemas": "/api/v1/schemas"
        }
    }