"""
API Gateway service for external API integration in the Chat Bot App.

This service handles forwarding completed BaseModel data to external APIs
and processing their responses for display to users.
"""

import json
import logging
import time
from typing import Dict, Any, Optional, Union, List
import httpx
from pydantic import BaseModel

from core.config import settings
from core.exceptions import APIGatewayError
from models.schemas import HTTPMethod


logger = logging.getLogger(__name__)


class APIResponse(BaseModel):
    """
    Response from external API call.
    
    Args:
        status_code: HTTP status code
        data: Response data
        headers: Response headers
        execution_time: Time taken for the request in seconds
    """
    status_code: int
    data: Optional[Union[Dict[str, Any], List[Any], str]]
    headers: Dict[str, str]
    execution_time: float


class APIGatewayService:
    """
    Service for forwarding requests to external APIs.
    
    This service acts as a gateway between the chat bot app and external APIs,
    handling authentication, error processing, and response formatting.
    """
    
    def __init__(self):
        """Initialize the API gateway service."""
        self.timeout = httpx.Timeout(30.0)  # Default 30 second timeout
        self.default_headers = {
            "User-Agent": "Chat Bot App API Gateway/1.0.0",
            "Content-Type": "application/json"
        }
    
    async def forward_request(
        self,
        api_url: str,
        method: HTTPMethod,
        data: Dict[str, Any],
        headers: Optional[Dict[str, str]] = None,
        timeout: int = 30
    ) -> APIResponse:
        """
        Forward request to external API.
        
        Args:
            api_url: URL of the external API endpoint
            method: HTTP method to use
            data: Data to send to the external API
            headers: Additional HTTP headers
            timeout: Request timeout in seconds
            
        Returns:
            APIResponse with results from external API
            
        Raises:
            APIGatewayError: If API request fails
        """
        try:
            logger.info(f"Forwarding {method.value} request to {api_url}")
            start_time = time.time()
            
            # Prepare headers
            request_headers = self.default_headers.copy()
            if headers:
                request_headers.update(headers)
            
            # Create timeout configuration
            request_timeout = httpx.Timeout(float(timeout))
            
            async with httpx.AsyncClient(timeout=request_timeout) as client:
                response = await self._make_request(
                    client=client,
                    method=method,
                    url=api_url,
                    data=data,
                    headers=request_headers
                )
            
            execution_time = time.time() - start_time
            
            # Process response
            api_response = await self._process_response(
                response=response,
                execution_time=execution_time
            )
            
            logger.info(f"Request completed in {execution_time:.2f}s with status {response.status_code}")
            return api_response
            
        except httpx.TimeoutException as e:
            logger.error(f"Request timeout for {api_url}: {str(e)}")
            raise APIGatewayError(
                message=f"Request timeout after {timeout} seconds",
                api_url=api_url,
                details={"timeout": timeout, "error": str(e)}
            )
        except httpx.RequestError as e:
            logger.error(f"Request error for {api_url}: {str(e)}")
            raise APIGatewayError(
                message=f"Request failed: {str(e)}",
                api_url=api_url,
                details={"error": str(e)}
            )
        except Exception as e:
            logger.error(f"Unexpected error for {api_url}: {str(e)}")
            raise APIGatewayError(
                message=f"Unexpected error: {str(e)}",
                api_url=api_url,
                details={"error": str(e)}
            )
    
    async def _make_request(
        self,
        client: httpx.AsyncClient,
        method: HTTPMethod,
        url: str,
        data: Dict[str, Any],
        headers: Dict[str, str]
    ) -> httpx.Response:
        """
        Make HTTP request with proper method handling.
        
        Args:
            client: HTTP client instance
            method: HTTP method
            url: Request URL
            data: Request data
            headers: Request headers
            
        Returns:
            HTTP response
        """
        json_data = json.dumps(data) if data else None
        
        if method == HTTPMethod.GET:
            # For GET requests, convert data to query parameters
            params = data if data else None
            return await client.get(url, headers=headers, params=params)
        elif method == HTTPMethod.POST:
            return await client.post(url, headers=headers, content=json_data)
        elif method == HTTPMethod.PUT:
            return await client.put(url, headers=headers, content=json_data)
        elif method == HTTPMethod.PATCH:
            return await client.patch(url, headers=headers, content=json_data)
        elif method == HTTPMethod.DELETE:
            return await client.delete(url, headers=headers, content=json_data)
        else:
            raise APIGatewayError(
                message=f"Unsupported HTTP method: {method.value}",
                api_url=url
            )
    
    async def _process_response(
        self,
        response: httpx.Response,
        execution_time: float
    ) -> APIResponse:
        """
        Process HTTP response into APIResponse.
        
        Args:
            response: HTTP response
            execution_time: Request execution time
            
        Returns:
            APIResponse object
        """
        # Extract response headers
        response_headers = dict(response.headers)
        
        # Parse response data
        response_data = await self._parse_response_data(response)
        
        return APIResponse(
            status_code=response.status_code,
            data=response_data,
            headers=response_headers,
            execution_time=execution_time
        )
    
    async def _parse_response_data(self, response: httpx.Response) -> Optional[Union[Dict[str, Any], List[Any], str]]:
        """
        Parse response data based on content type.
        
        Args:
            response: HTTP response
            
        Returns:
            Parsed response data
        """
        content_type = response.headers.get("content-type", "").lower()
        
        try:
            if "application/json" in content_type:
                return response.json()
            elif "text/" in content_type:
                return response.text
            else:
                # For binary or unknown content types, return as base64 string
                import base64
                return base64.b64encode(response.content).decode('utf-8')
        except Exception as e:
            logger.warning(f"Failed to parse response data: {str(e)}")
            return response.text
    
    async def validate_api_endpoint(self, api_url: str) -> bool:
        """
        Validate that an API endpoint is reachable.
        
        Args:
            api_url: URL to validate
            
        Returns:
            True if endpoint is reachable, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
                response = await client.head(api_url, headers=self.default_headers)
                return response.status_code < 500
        except Exception as e:
            logger.warning(f"API endpoint validation failed for {api_url}: {str(e)}")
            return False
    
    async def get_api_info(self, api_url: str) -> Dict[str, Any]:
        """
        Get information about an API endpoint.
        
        Args:
            api_url: URL to get information about
            
        Returns:
            Dictionary with API information
        """
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
                response = await client.options(api_url, headers=self.default_headers)
                
                return {
                    "url": api_url,
                    "status_code": response.status_code,
                    "headers": dict(response.headers),
                    "allowed_methods": response.headers.get("Allow", "").split(", ") if response.headers.get("Allow") else [],
                    "reachable": response.status_code < 500
                }
        except Exception as e:
            return {
                "url": api_url,
                "status_code": None,
                "headers": {},
                "allowed_methods": [],
                "reachable": False,
                "error": str(e)
            }
    
    async def test_api_connection(
        self,
        api_url: str,
        method: HTTPMethod = HTTPMethod.GET,
        sample_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Test API connection with sample data.
        
        Args:
            api_url: URL to test
            method: HTTP method to use
            sample_data: Sample data for testing
            
        Returns:
            Dictionary with test results
        """
        try:
            response = await self.forward_request(
                api_url=api_url,
                method=method,
                data=sample_data or {},
                timeout=10
            )
            
            return {
                "success": True,
                "status_code": response.status_code,
                "execution_time": response.execution_time,
                "response_size": len(str(response.data)) if response.data else 0,
                "content_type": response.headers.get("content-type", "unknown")
            }
            
        except APIGatewayError as e:
            return {
                "success": False,
                "error": e.message,
                "details": e.details
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }