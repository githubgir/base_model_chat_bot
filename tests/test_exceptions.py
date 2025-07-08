"""
Tests for custom exceptions and exception handlers.

This module tests the custom exception classes and their
HTTP exception conversion functions.
"""

import pytest
from fastapi import HTTPException

from core.exceptions import (
    SchemaParsingError,
    OpenAIServiceError,
    APIGatewayError,
    schema_parsing_http_exception,
    openai_service_http_exception,
    api_gateway_http_exception
)


class TestCustomExceptions:
    """Test cases for custom exception classes."""
    
    def test_schema_parsing_error_creation(self):
        """Test SchemaParsingError creation."""
        message = "Invalid model definition"
        details = {"line": 5, "error": "syntax error"}
        
        error = SchemaParsingError(message, details)
        
        assert str(error) == message
        assert error.message == message
        assert error.details == details
    
    def test_schema_parsing_error_without_details(self):
        """Test SchemaParsingError creation without details."""
        message = "Schema parsing failed"
        
        error = SchemaParsingError(message)
        
        assert str(error) == message
        assert error.message == message
        assert error.details is None
    
    def test_openai_service_error_creation(self):
        """Test OpenAIServiceError creation."""
        message = "API rate limit exceeded"
        details = {"retry_after": 60, "code": "rate_limit"}
        
        error = OpenAIServiceError(message, details)
        
        assert str(error) == message
        assert error.message == message
        assert error.details == details
    
    def test_openai_service_error_without_details(self):
        """Test OpenAIServiceError creation without details."""
        message = "OpenAI API error"
        
        error = OpenAIServiceError(message)
        
        assert str(error) == message
        assert error.message == message
        assert error.details is None
    
    def test_api_gateway_error_creation(self):
        """Test APIGatewayError creation."""
        message = "Connection timeout"
        details = {"timeout": 30, "url": "https://example.com"}
        
        error = APIGatewayError(message, details)
        
        assert str(error) == message
        assert error.message == message
        assert error.details == details
    
    def test_api_gateway_error_without_details(self):
        """Test APIGatewayError creation without details."""
        message = "Gateway error"
        
        error = APIGatewayError(message)
        
        assert str(error) == message
        assert error.message == message
        assert error.details is None


class TestExceptionConverters:
    """Test cases for exception to HTTP exception converters."""
    
    def test_schema_parsing_http_exception(self):
        """Test converting SchemaParsingError to HTTPException."""
        error = SchemaParsingError("Invalid schema", {"line": 10})
        
        http_exc = schema_parsing_http_exception(error)
        
        assert isinstance(http_exc, HTTPException)
        assert http_exc.status_code == 400
        assert "Invalid schema" in http_exc.detail
    
    def test_schema_parsing_http_exception_with_details(self):
        """Test converting SchemaParsingError with details to HTTPException."""
        details = {"line": 5, "column": 10, "error_type": "SyntaxError"}
        error = SchemaParsingError("Syntax error in model", details)
        
        http_exc = schema_parsing_http_exception(error)
        
        assert isinstance(http_exc, HTTPException)
        assert http_exc.status_code == 400
        assert "Syntax error in model" in http_exc.detail
        # Details should be included in the error message
        assert "line" in http_exc.detail or "SyntaxError" in http_exc.detail
    
    def test_openai_service_http_exception(self):
        """Test converting OpenAIServiceError to HTTPException."""
        error = OpenAIServiceError("API unavailable")
        
        http_exc = openai_service_http_exception(error)
        
        assert isinstance(http_exc, HTTPException)
        assert http_exc.status_code == 502  # Bad Gateway for external service errors
        assert "API unavailable" in http_exc.detail
    
    def test_openai_service_http_exception_rate_limit(self):
        """Test converting OpenAIServiceError for rate limiting."""
        details = {"code": "rate_limit_exceeded", "retry_after": 60}
        error = OpenAIServiceError("Rate limit exceeded", details)
        
        http_exc = openai_service_http_exception(error)
        
        assert isinstance(http_exc, HTTPException)
        assert http_exc.status_code == 429  # Too Many Requests
        assert "Rate limit exceeded" in http_exc.detail
    
    def test_openai_service_http_exception_authentication(self):
        """Test converting OpenAIServiceError for authentication."""
        details = {"code": "invalid_api_key"}
        error = OpenAIServiceError("Invalid API key", details)
        
        http_exc = openai_service_http_exception(error)
        
        assert isinstance(http_exc, HTTPException)
        assert http_exc.status_code == 401  # Unauthorized
        assert "Invalid API key" in http_exc.detail
    
    def test_openai_service_http_exception_quota(self):
        """Test converting OpenAIServiceError for quota exceeded."""
        details = {"code": "quota_exceeded"}
        error = OpenAIServiceError("Quota exceeded", details)
        
        http_exc = openai_service_http_exception(error)
        
        assert isinstance(http_exc, HTTPException)
        assert http_exc.status_code == 429  # Too Many Requests
        assert "Quota exceeded" in http_exc.detail
    
    def test_api_gateway_http_exception(self):
        """Test converting APIGatewayError to HTTPException."""
        error = APIGatewayError("Connection failed")
        
        http_exc = api_gateway_http_exception(error)
        
        assert isinstance(http_exc, HTTPException)
        assert http_exc.status_code == 502  # Bad Gateway
        assert "Connection failed" in http_exc.detail
    
    def test_api_gateway_http_exception_timeout(self):
        """Test converting APIGatewayError for timeout."""
        details = {"timeout": 30}
        error = APIGatewayError("Request timeout", details)
        
        http_exc = api_gateway_http_exception(error)
        
        assert isinstance(http_exc, HTTPException)
        assert http_exc.status_code == 504  # Gateway Timeout
        assert "Request timeout" in http_exc.detail
    
    def test_api_gateway_http_exception_client_error(self):
        """Test converting APIGatewayError for client errors."""
        details = {"status_code": 404}
        error = APIGatewayError("External API not found", details)
        
        http_exc = api_gateway_http_exception(error)
        
        assert isinstance(http_exc, HTTPException)
        assert http_exc.status_code == 404  # Not Found
        assert "External API not found" in http_exc.detail
    
    def test_api_gateway_http_exception_server_error(self):
        """Test converting APIGatewayError for server errors."""
        details = {"status_code": 500}
        error = APIGatewayError("External server error", details)
        
        http_exc = api_gateway_http_exception(error)
        
        assert isinstance(http_exc, HTTPException)
        assert http_exc.status_code == 502  # Bad Gateway
        assert "External server error" in http_exc.detail
    
    def test_exception_inheritance(self):
        """Test that custom exceptions inherit from Exception."""
        schema_error = SchemaParsingError("test")
        openai_error = OpenAIServiceError("test")
        gateway_error = APIGatewayError("test")
        
        assert isinstance(schema_error, Exception)
        assert isinstance(openai_error, Exception)
        assert isinstance(gateway_error, Exception)
    
    def test_exception_string_representation(self):
        """Test string representation of exceptions."""
        message = "Test error message"
        
        schema_error = SchemaParsingError(message)
        openai_error = OpenAIServiceError(message)
        gateway_error = APIGatewayError(message)
        
        assert str(schema_error) == message
        assert str(openai_error) == message
        assert str(gateway_error) == message
        
        assert repr(schema_error) == f"SchemaParsingError('{message}')"
        assert repr(openai_error) == f"OpenAIServiceError('{message}')"
        assert repr(gateway_error) == f"APIGatewayError('{message}')"
    
    def test_exception_equality(self):
        """Test exception equality comparison."""
        message = "Same message"
        details = {"key": "value"}
        
        error1 = SchemaParsingError(message, details)
        error2 = SchemaParsingError(message, details)
        error3 = SchemaParsingError("Different message", details)
        
        assert error1.message == error2.message
        assert error1.details == error2.details
        assert error1.message != error3.message
    
    def test_exception_with_none_details(self):
        """Test exception handling when details is explicitly None."""
        error = OpenAIServiceError("Test message", None)
        
        assert error.message == "Test message"
        assert error.details is None
        
        http_exc = openai_service_http_exception(error)
        assert isinstance(http_exc, HTTPException)
    
    def test_exception_with_empty_details(self):
        """Test exception handling when details is empty dict."""
        error = APIGatewayError("Test message", {})
        
        assert error.message == "Test message"
        assert error.details == {}
        
        http_exc = api_gateway_http_exception(error)
        assert isinstance(http_exc, HTTPException)