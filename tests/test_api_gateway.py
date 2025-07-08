"""
Tests for the APIGatewayService.

This module tests the functionality of the API gateway service
for forwarding requests to external APIs.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import json
import httpx

from services.api_gateway import APIGatewayService, APIGatewayResponse
from core.exceptions import APIGatewayError


class TestAPIGatewayService:
    """Test cases for APIGatewayService."""
    
    @pytest.fixture
    def api_gateway(self, mock_httpx_client):
        """Create an APIGatewayService instance with mocked client."""
        with patch('services.api_gateway.httpx.AsyncClient') as mock_client_class:
            mock_client_class.return_value.__aenter__.return_value = mock_httpx_client
            service = APIGatewayService()
            return service
    
    @pytest.mark.asyncio
    async def test_forward_request_post_success(self, api_gateway, mock_httpx_client):
        """Test successful POST request forwarding."""
        # Setup mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {"Content-Type": "application/json"}
        mock_response.json.return_value = {"success": True, "data": "test"}
        mock_response.text = '{"success": true, "data": "test"}'
        mock_httpx_client.request.return_value = mock_response
        
        result = await api_gateway.forward_request(
            api_url="https://httpbin.org/post",
            method="POST",
            data={"name": "John", "email": "john@example.com"},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert isinstance(result, APIGatewayResponse)
        assert result.success is True
        assert result.status_code == 200
        assert result.data == {"success": True, "data": "test"}
        assert result.headers == {"Content-Type": "application/json"}
        assert result.execution_time > 0
        
        # Verify the request was made correctly
        mock_httpx_client.request.assert_called_once()
        call_args = mock_httpx_client.request.call_args
        assert call_args[1]['method'] == "POST"
        assert call_args[1]['url'] == "https://httpbin.org/post"
        assert call_args[1]['timeout'] == 30
    
    @pytest.mark.asyncio
    async def test_forward_request_get_success(self, api_gateway, mock_httpx_client):
        """Test successful GET request forwarding."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {"Content-Type": "application/json"}
        mock_response.json.return_value = {"status": "ok"}
        mock_response.text = '{"status": "ok"}'
        mock_httpx_client.request.return_value = mock_response
        
        result = await api_gateway.forward_request(
            api_url="https://httpbin.org/get",
            method="GET",
            data={},
            headers={},
            timeout=30
        )
        
        assert result.success is True
        assert result.status_code == 200
        assert result.data == {"status": "ok"}
        
        # Verify GET request doesn't include JSON data
        call_args = mock_httpx_client.request.call_args
        assert call_args[1]['method'] == "GET"
        assert 'json' not in call_args[1]
    
    @pytest.mark.asyncio
    async def test_forward_request_put_success(self, api_gateway, mock_httpx_client):
        """Test successful PUT request forwarding."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {"Content-Type": "application/json"}
        mock_response.json.return_value = {"updated": True}
        mock_response.text = '{"updated": true}'
        mock_httpx_client.request.return_value = mock_response
        
        result = await api_gateway.forward_request(
            api_url="https://httpbin.org/put",
            method="PUT",
            data={"id": 1, "name": "Updated Name"},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert result.success is True
        assert result.data == {"updated": True}
        
        call_args = mock_httpx_client.request.call_args
        assert call_args[1]['method'] == "PUT"
        assert call_args[1]['json'] == {"id": 1, "name": "Updated Name"}
    
    @pytest.mark.asyncio
    async def test_forward_request_delete_success(self, api_gateway, mock_httpx_client):
        """Test successful DELETE request forwarding."""
        mock_response = Mock()
        mock_response.status_code = 204
        mock_response.headers = {}
        mock_response.json.side_effect = json.JSONDecodeError("No JSON", "", 0)
        mock_response.text = ""
        mock_httpx_client.request.return_value = mock_response
        
        result = await api_gateway.forward_request(
            api_url="https://httpbin.org/delete",
            method="DELETE",
            data={},
            headers={},
            timeout=30
        )
        
        assert result.success is True
        assert result.status_code == 204
        assert result.data == ""  # No content for DELETE
    
    @pytest.mark.asyncio
    async def test_forward_request_client_error(self, api_gateway, mock_httpx_client):
        """Test handling client errors (4xx status codes)."""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.headers = {"Content-Type": "application/json"}
        mock_response.json.return_value = {"error": "Not found"}
        mock_response.text = '{"error": "Not found"}'
        mock_httpx_client.request.return_value = mock_response
        
        result = await api_gateway.forward_request(
            api_url="https://httpbin.org/status/404",
            method="GET",
            data={},
            headers={},
            timeout=30
        )
        
        assert result.success is False
        assert result.status_code == 404
        assert result.data == {"error": "Not found"}
    
    @pytest.mark.asyncio
    async def test_forward_request_server_error(self, api_gateway, mock_httpx_client):
        """Test handling server errors (5xx status codes)."""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.headers = {"Content-Type": "text/html"}
        mock_response.json.side_effect = json.JSONDecodeError("No JSON", "", 0)
        mock_response.text = "Internal Server Error"
        mock_httpx_client.request.return_value = mock_response
        
        result = await api_gateway.forward_request(
            api_url="https://httpbin.org/status/500",
            method="GET",
            data={},
            headers={},
            timeout=30
        )
        
        assert result.success is False
        assert result.status_code == 500
        assert result.data == "Internal Server Error"
    
    @pytest.mark.asyncio
    async def test_forward_request_timeout_error(self, api_gateway, mock_httpx_client):
        """Test handling timeout errors."""
        mock_httpx_client.request.side_effect = httpx.TimeoutException("Request timeout")
        
        with pytest.raises(APIGatewayError) as exc_info:
            await api_gateway.forward_request(
                api_url="https://httpbin.org/delay/10",
                method="GET",
                data={},
                headers={},
                timeout=1
            )
        
        assert "Request timeout" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_forward_request_connection_error(self, api_gateway, mock_httpx_client):
        """Test handling connection errors."""
        mock_httpx_client.request.side_effect = httpx.ConnectError("Connection failed")
        
        with pytest.raises(APIGatewayError) as exc_info:
            await api_gateway.forward_request(
                api_url="https://invalid-domain-12345.com",
                method="GET",
                data={},
                headers={},
                timeout=30
            )
        
        assert "Connection failed" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_forward_request_invalid_url(self, api_gateway):
        """Test handling invalid URLs."""
        with pytest.raises(APIGatewayError) as exc_info:
            await api_gateway.forward_request(
                api_url="not-a-valid-url",
                method="GET",
                data={},
                headers={},
                timeout=30
            )
        
        assert "Invalid URL" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_forward_request_invalid_method(self, api_gateway):
        """Test handling invalid HTTP methods."""
        with pytest.raises(APIGatewayError) as exc_info:
            await api_gateway.forward_request(
                api_url="https://httpbin.org/get",
                method="INVALID",
                data={},
                headers={},
                timeout=30
            )
        
        assert "Invalid HTTP method" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_forward_request_custom_headers(self, api_gateway, mock_httpx_client):
        """Test forwarding with custom headers."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {"Content-Type": "application/json"}
        mock_response.json.return_value = {"success": True}
        mock_response.text = '{"success": true}'
        mock_httpx_client.request.return_value = mock_response
        
        custom_headers = {
            "Authorization": "Bearer token123",
            "X-Custom-Header": "custom-value",
            "Content-Type": "application/json"
        }
        
        await api_gateway.forward_request(
            api_url="https://httpbin.org/post",
            method="POST",
            data={"test": "data"},
            headers=custom_headers,
            timeout=30
        )
        
        call_args = mock_httpx_client.request.call_args
        request_headers = call_args[1]['headers']
        
        assert "Authorization" in request_headers
        assert "X-Custom-Header" in request_headers
        assert request_headers["Authorization"] == "Bearer token123"
        assert request_headers["X-Custom-Header"] == "custom-value"
    
    @pytest.mark.asyncio
    async def test_forward_request_large_payload(self, api_gateway, mock_httpx_client):
        """Test forwarding with large data payload."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {"Content-Type": "application/json"}
        mock_response.json.return_value = {"received": True}
        mock_response.text = '{"received": true}'
        mock_httpx_client.request.return_value = mock_response
        
        # Create a large payload
        large_data = {"items": [{"id": i, "name": f"item_{i}"} for i in range(1000)]}
        
        result = await api_gateway.forward_request(
            api_url="https://httpbin.org/post",
            method="POST",
            data=large_data,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert result.success is True
        assert result.data == {"received": True}
    
    @pytest.mark.asyncio
    async def test_forward_request_response_headers_extraction(self, api_gateway, mock_httpx_client):
        """Test extraction of response headers."""
        response_headers = {
            "Content-Type": "application/json",
            "X-Rate-Limit": "100",
            "Cache-Control": "no-cache",
            "Set-Cookie": "session=abc123"
        }
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = response_headers
        mock_response.json.return_value = {"data": "test"}
        mock_response.text = '{"data": "test"}'
        mock_httpx_client.request.return_value = mock_response
        
        result = await api_gateway.forward_request(
            api_url="https://httpbin.org/get",
            method="GET",
            data={},
            headers={},
            timeout=30
        )
        
        assert result.headers == response_headers
        assert result.headers["X-Rate-Limit"] == "100"
        assert result.headers["Cache-Control"] == "no-cache"
    
    @pytest.mark.asyncio
    async def test_forward_request_execution_time_measurement(self, api_gateway, mock_httpx_client):
        """Test execution time measurement."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {}
        mock_response.json.return_value = {"success": True}
        mock_response.text = '{"success": true}'
        mock_httpx_client.request.return_value = mock_response
        
        result = await api_gateway.forward_request(
            api_url="https://httpbin.org/get",
            method="GET",
            data={},
            headers={},
            timeout=30
        )
        
        assert result.execution_time >= 0
        assert isinstance(result.execution_time, float)
    
    @pytest.mark.asyncio
    async def test_validate_url_valid_urls(self, api_gateway):
        """Test URL validation with valid URLs."""
        valid_urls = [
            "https://example.com",
            "http://localhost:8000",
            "https://api.example.com/v1/users",
            "http://127.0.0.1:3000/api"
        ]
        
        for url in valid_urls:
            # Should not raise an exception
            api_gateway._validate_url(url)
    
    @pytest.mark.asyncio
    async def test_validate_url_invalid_urls(self, api_gateway):
        """Test URL validation with invalid URLs."""
        invalid_urls = [
            "not-a-url",
            "ftp://example.com",
            "javascript:alert('xss')",
            "",
            "http://",
            "https://"
        ]
        
        for url in invalid_urls:
            with pytest.raises(APIGatewayError):
                api_gateway._validate_url(url)
    
    @pytest.mark.asyncio
    async def test_validate_method_valid_methods(self, api_gateway):
        """Test HTTP method validation with valid methods."""
        valid_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]
        
        for method in valid_methods:
            # Should not raise an exception
            api_gateway._validate_method(method)
    
    @pytest.mark.asyncio
    async def test_validate_method_invalid_methods(self, api_gateway):
        """Test HTTP method validation with invalid methods."""
        invalid_methods = ["INVALID", "TRACE", "CONNECT", "", "get", "post"]
        
        for method in invalid_methods:
            with pytest.raises(APIGatewayError):
                api_gateway._validate_method(method)