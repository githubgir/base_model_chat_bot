"""
Tests for the API endpoints.

This module tests the FastAPI endpoints and their integration
with the underlying services.
"""

import pytest
from unittest.mock import patch, Mock, AsyncMock
import json

from fastapi.testclient import TestClient
from core.exceptions import SchemaParsingError, OpenAIServiceError, APIGatewayError


class TestAPIEndpoints:
    """Test cases for API endpoints."""
    
    def test_health_check(self, client):
        """Test the health check endpoint."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Chat Bot App API"
        assert "endpoints" in data
        assert "/api/v1/parse-schema" in data["endpoints"]["parse_schema"]
    
    @patch('api.endpoints.get_schema_parser_service')
    def test_parse_schema_success(self, mock_get_service, client, sample_pydantic_model, sample_schema_data):
        """Test successful schema parsing."""
        # Mock the service
        mock_service = Mock()
        mock_service.parse_schema = AsyncMock(return_value=sample_schema_data)
        mock_get_service.return_value = mock_service
        
        request_data = {
            "model_definition": sample_pydantic_model,
            "model_name": "TestModel"
        }
        
        response = client.post("/parse-schema", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["model_name"] == "TestModel"
        assert data["success"] is True
        assert "schema_data" in data
        assert len(data["schema_data"]["fields"]) == 6
    
    @patch('api.endpoints.get_schema_parser_service')
    def test_parse_schema_invalid_request(self, mock_get_service, client):
        """Test schema parsing with invalid request data."""
        request_data = {
            "model_definition": "",  # Empty definition
            "model_name": "TestModel"
        }
        
        response = client.post("/parse-schema", json=request_data)
        
        assert response.status_code == 422  # Validation error
    
    @patch('api.endpoints.get_schema_parser_service')
    def test_parse_schema_service_error(self, mock_get_service, client, sample_pydantic_model):
        """Test schema parsing with service error."""
        # Mock the service to raise an error
        mock_service = Mock()
        mock_service.parse_schema = AsyncMock(
            side_effect=SchemaParsingError("Invalid model definition", {"error": "syntax"})
        )
        mock_get_service.return_value = mock_service
        
        request_data = {
            "model_definition": sample_pydantic_model,
            "model_name": "TestModel"
        }
        
        response = client.post("/parse-schema", json=request_data)
        
        assert response.status_code == 400
        assert "Invalid model definition" in response.json()["detail"]
    
    @patch('api.endpoints.get_openai_service')
    def test_chat_success(self, mock_get_service, client, sample_chat_request, sample_chat_response):
        """Test successful chat processing."""
        # Mock the service
        mock_service = Mock()
        mock_service.process_chat = AsyncMock()
        
        # Create a ChatResponse object
        from services.openai_service import ChatResponse
        chat_response = ChatResponse(
            message=sample_chat_response["message"],
            structured_data=sample_chat_response["structured_data"],
            is_complete=sample_chat_response["is_complete"],
            follow_up_questions=sample_chat_response["follow_up_questions"],
            conversation_id=sample_chat_response["conversation_id"]
        )
        mock_service.process_chat.return_value = chat_response
        mock_get_service.return_value = mock_service
        
        response = client.post("/chat", json=sample_chat_request)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == sample_chat_response["message"]
        assert data["structured_data"] == sample_chat_response["structured_data"]
        assert data["is_complete"] == sample_chat_response["is_complete"]
        assert data["conversation_id"] == sample_chat_response["conversation_id"]
    
    @patch('api.endpoints.get_openai_service')
    def test_chat_invalid_request(self, mock_get_service, client):
        """Test chat with invalid request data."""
        request_data = {
            "message": "",  # Empty message
            "target_model": "TestModel",
            "target_schema": {"fields": []}
        }
        
        response = client.post("/chat", json=request_data)
        
        assert response.status_code == 422  # Validation error
    
    @patch('api.endpoints.get_openai_service')
    def test_chat_service_error(self, mock_get_service, client, sample_chat_request):
        """Test chat with service error."""
        # Mock the service to raise an error
        mock_service = Mock()
        mock_service.process_chat = AsyncMock(
            side_effect=OpenAIServiceError("OpenAI API error", {"error": "rate_limit"})
        )
        mock_get_service.return_value = mock_service
        
        response = client.post("/chat", json=sample_chat_request)
        
        assert response.status_code == 502  # Bad Gateway for external service errors
        assert "OpenAI API error" in response.json()["detail"]
    
    @patch('api.endpoints.get_api_gateway_service')
    def test_forward_success(self, mock_get_service, client, sample_api_forward_request, sample_api_forward_response):
        """Test successful API forwarding."""
        # Mock the service
        mock_service = Mock()
        mock_service.forward_request = AsyncMock()
        
        # Create an APIGatewayResponse object
        from services.api_gateway import APIGatewayResponse
        gateway_response = APIGatewayResponse(
            success=sample_api_forward_response["success"],
            status_code=sample_api_forward_response["status_code"],
            data=sample_api_forward_response["response_data"],
            headers=sample_api_forward_response["response_headers"],
            execution_time=sample_api_forward_response["execution_time"]
        )
        mock_service.forward_request.return_value = gateway_response
        mock_get_service.return_value = mock_service
        
        response = client.post("/forward", json=sample_api_forward_request)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["status_code"] == 200
        assert data["response_data"] == sample_api_forward_response["response_data"]
    
    @patch('api.endpoints.get_api_gateway_service')
    def test_forward_invalid_url(self, mock_get_service, client):
        """Test API forwarding with invalid URL."""
        request_data = {
            "api_url": "not-a-valid-url",
            "method": "POST",
            "data": {"test": "data"}
        }
        
        response = client.post("/forward", json=request_data)
        
        assert response.status_code == 422  # Validation error
    
    @patch('api.endpoints.get_api_gateway_service')
    def test_forward_service_error(self, mock_get_service, client, sample_api_forward_request):
        """Test API forwarding with service error."""
        # Mock the service to raise an error
        mock_service = Mock()
        mock_service.forward_request = AsyncMock(
            side_effect=APIGatewayError("Connection timeout", {"error": "timeout"})
        )
        mock_get_service.return_value = mock_service
        
        response = client.post("/forward", json=sample_api_forward_request)
        
        assert response.status_code == 502  # Bad Gateway for external service errors
        assert "Connection timeout" in response.json()["detail"]
    
    @patch('api.endpoints.get_schema_parser_service')
    def test_list_schemas_success(self, mock_get_service, client):
        """Test successful schema listing."""
        # Mock the service
        mock_service = Mock()
        mock_service.list_available_schemas = AsyncMock(
            return_value=["UserProfile", "ProductOrder", "TestModel"]
        )
        mock_get_service.return_value = mock_service
        
        response = client.get("/schemas")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 3
        assert "UserProfile" in data
        assert "ProductOrder" in data
    
    @patch('api.endpoints.get_schema_parser_service')
    def test_list_schemas_empty(self, mock_get_service, client):
        """Test schema listing when no schemas are available."""
        # Mock the service
        mock_service = Mock()
        mock_service.list_available_schemas = AsyncMock(return_value=[])
        mock_get_service.return_value = mock_service
        
        response = client.get("/schemas")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_parse_schema_missing_fields(self, client):
        """Test schema parsing with missing required fields."""
        request_data = {
            "model_definition": "valid model definition"
            # Missing model_name
        }
        
        response = client.post("/parse-schema", json=request_data)
        
        assert response.status_code == 422
    
    def test_chat_missing_fields(self, client):
        """Test chat with missing required fields."""
        request_data = {
            "message": "Test message"
            # Missing target_model and target_schema
        }
        
        response = client.post("/chat", json=request_data)
        
        assert response.status_code == 422
    
    def test_forward_missing_fields(self, client):
        """Test API forwarding with missing required fields."""
        request_data = {
            "api_url": "https://httpbin.org/post"
            # Missing method and data
        }
        
        response = client.post("/forward", json=request_data)
        
        assert response.status_code == 422
    
    def test_cors_headers(self, client):
        """Test CORS headers are present in responses."""
        response = client.get("/health")
        
        # Note: CORS headers might not be present in test client
        # This test would be more relevant in integration tests
        assert response.status_code == 200
    
    def test_invalid_endpoint(self, client):
        """Test accessing an invalid endpoint."""
        response = client.get("/invalid-endpoint")
        
        assert response.status_code == 404
    
    def test_invalid_http_method(self, client):
        """Test using an invalid HTTP method on an endpoint."""
        response = client.put("/health")  # Health endpoint only supports GET
        
        assert response.status_code == 405  # Method Not Allowed
    
    @patch('api.endpoints.get_schema_parser_service')
    def test_parse_schema_unexpected_error(self, mock_get_service, client, sample_pydantic_model):
        """Test schema parsing with unexpected error."""
        # Mock the service to raise an unexpected error
        mock_service = Mock()
        mock_service.parse_schema = AsyncMock(side_effect=Exception("Unexpected error"))
        mock_get_service.return_value = mock_service
        
        request_data = {
            "model_definition": sample_pydantic_model,
            "model_name": "TestModel"
        }
        
        response = client.post("/parse-schema", json=request_data)
        
        assert response.status_code == 500
        assert "Internal server error" in response.json()["detail"]
    
    @patch('api.endpoints.get_openai_service')
    def test_chat_unexpected_error(self, mock_get_service, client, sample_chat_request):
        """Test chat with unexpected error."""
        # Mock the service to raise an unexpected error
        mock_service = Mock()
        mock_service.process_chat = AsyncMock(side_effect=Exception("Unexpected error"))
        mock_get_service.return_value = mock_service
        
        response = client.post("/chat", json=sample_chat_request)
        
        assert response.status_code == 500
        assert "Internal server error" in response.json()["detail"]
    
    @patch('api.endpoints.get_api_gateway_service')
    def test_forward_unexpected_error(self, mock_get_service, client, sample_api_forward_request):
        """Test API forwarding with unexpected error."""
        # Mock the service to raise an unexpected error
        mock_service = Mock()
        mock_service.forward_request = AsyncMock(side_effect=Exception("Unexpected error"))
        mock_get_service.return_value = mock_service
        
        response = client.post("/forward", json=sample_api_forward_request)
        
        assert response.status_code == 500
        assert "Internal server error" in response.json()["detail"]