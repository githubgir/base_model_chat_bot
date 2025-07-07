"""
Custom exceptions for the Chat Bot App.

This module defines custom exception classes used throughout the application
for consistent error handling and response formatting.
"""

from fastapi import HTTPException, status
from typing import Any, Dict, Optional


class ChatBotAppException(Exception):
    """
    Base exception class for Chat Bot App.
    
    Args:
        message: Error message
        details: Additional error details
    """
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class SchemaParsingError(ChatBotAppException):
    """
    Exception raised when Pydantic schema parsing fails.
    
    Args:
        message: Error message
        schema_name: Name of the schema that failed to parse
        details: Additional error details
    """
    
    def __init__(self, message: str, schema_name: str, details: Optional[Dict[str, Any]] = None):
        self.schema_name = schema_name
        super().__init__(message, details)


class OpenAIServiceError(ChatBotAppException):
    """
    Exception raised when OpenAI API integration fails.
    
    Args:
        message: Error message
        api_error: Original API error details
        details: Additional error details
    """
    
    def __init__(self, message: str, api_error: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        self.api_error = api_error
        super().__init__(message, details)


class APIGatewayError(ChatBotAppException):
    """
    Exception raised when external API communication fails.
    
    Args:
        message: Error message
        api_url: URL of the external API
        status_code: HTTP status code from the external API
        details: Additional error details
    """
    
    def __init__(self, message: str, api_url: str, status_code: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        self.api_url = api_url
        self.status_code = status_code
        super().__init__(message, details)


class ValidationError(ChatBotAppException):
    """
    Exception raised when data validation fails.
    
    Args:
        message: Error message
        field_errors: Dictionary of field-specific validation errors
        details: Additional error details
    """
    
    def __init__(self, message: str, field_errors: Optional[Dict[str, str]] = None, details: Optional[Dict[str, Any]] = None):
        self.field_errors = field_errors or {}
        super().__init__(message, details)


def create_http_exception(
    status_code: int,
    message: str,
    details: Optional[Dict[str, Any]] = None
) -> HTTPException:
    """
    Create an HTTPException with consistent formatting.
    
    Args:
        status_code: HTTP status code
        message: Error message
        details: Additional error details
    
    Returns:
        HTTPException with formatted error response
    """
    return HTTPException(
        status_code=status_code,
        detail={
            "error": True,
            "message": message,
            "details": details or {}
        }
    )


def schema_parsing_http_exception(error: SchemaParsingError) -> HTTPException:
    """
    Convert SchemaParsingError to HTTPException.
    
    Args:
        error: SchemaParsingError instance
    
    Returns:
        HTTPException with formatted error response
    """
    return create_http_exception(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        message=f"Schema parsing failed for {error.schema_name}: {error.message}",
        details={"schema_name": error.schema_name, **error.details}
    )


def openai_service_http_exception(error: OpenAIServiceError) -> HTTPException:
    """
    Convert OpenAIServiceError to HTTPException.
    
    Args:
        error: OpenAIServiceError instance
    
    Returns:
        HTTPException with formatted error response
    """
    return create_http_exception(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        message=f"OpenAI service error: {error.message}",
        details={"api_error": error.api_error, **error.details}
    )


def api_gateway_http_exception(error: APIGatewayError) -> HTTPException:
    """
    Convert APIGatewayError to HTTPException.
    
    Args:
        error: APIGatewayError instance
    
    Returns:
        HTTPException with formatted error response
    """
    status_code = error.status_code or status.HTTP_502_BAD_GATEWAY
    return create_http_exception(
        status_code=status_code,
        message=f"External API error: {error.message}",
        details={"api_url": error.api_url, "status_code": error.status_code, **error.details}
    )


def validation_http_exception(error: ValidationError) -> HTTPException:
    """
    Convert ValidationError to HTTPException.
    
    Args:
        error: ValidationError instance
    
    Returns:
        HTTPException with formatted error response
    """
    return create_http_exception(
        status_code=status.HTTP_400_BAD_REQUEST,
        message=f"Validation error: {error.message}",
        details={"field_errors": error.field_errors, **error.details}
    )