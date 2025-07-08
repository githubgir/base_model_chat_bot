"""
Pytest configuration and fixtures for the Chat Bot App tests.

This file contains shared fixtures and configuration for all tests.
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock
from fastapi.testclient import TestClient
from typing import Generator, Dict, Any
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app
from services.schema_parser import SchemaParserService
from services.openai_service import OpenAIService
from services.api_gateway import APIGatewayService


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Create a test client for the FastAPI application."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_pydantic_model() -> str:
    """Sample Pydantic model definition for testing."""
    return """
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"

class TestModel(BaseModel):
    name: str = Field(..., description="Full name of the user")
    email: str = Field(..., description="Email address")
    age: int = Field(..., ge=18, le=120, description="Age in years")
    role: UserRole = Field(UserRole.USER, description="User role")
    is_active: bool = Field(True, description="Whether active")
    bio: Optional[str] = Field(None, description="Optional biography")
"""


@pytest.fixture
def sample_schema_data() -> Dict[str, Any]:
    """Sample parsed schema data for testing."""
    return {
        "model_name": "TestModel",
        "fields": [
            {
                "name": "name",
                "type": "string",
                "required": True,
                "description": "Full name of the user"
            },
            {
                "name": "email",
                "type": "string",
                "required": True,
                "description": "Email address"
            },
            {
                "name": "age",
                "type": "integer",
                "required": True,
                "description": "Age in years"
            },
            {
                "name": "role",
                "type": "string",
                "required": False,
                "description": "User role",
                "options": ["admin", "user", "guest"]
            },
            {
                "name": "is_active",
                "type": "boolean",
                "required": False,
                "description": "Whether active"
            },
            {
                "name": "bio",
                "type": "string",
                "required": False,
                "description": "Optional biography"
            }
        ]
    }


@pytest.fixture
def mock_schema_parser_service() -> Mock:
    """Mock SchemaParserService for testing."""
    mock_service = Mock(spec=SchemaParserService)
    mock_service.parse_schema = AsyncMock()
    mock_service.list_available_schemas = AsyncMock(return_value=["TestModel", "UserProfile"])
    return mock_service


@pytest.fixture
def mock_openai_service() -> Mock:
    """Mock OpenAIService for testing."""
    mock_service = Mock(spec=OpenAIService)
    mock_service.process_chat = AsyncMock()
    return mock_service


@pytest.fixture
def mock_api_gateway_service() -> Mock:
    """Mock APIGatewayService for testing."""
    mock_service = Mock(spec=APIGatewayService)
    mock_service.forward_request = AsyncMock()
    return mock_service


@pytest.fixture
def sample_chat_request() -> Dict[str, Any]:
    """Sample chat request data for testing."""
    return {
        "message": "I want to create a user profile for John Doe",
        "target_model": "TestModel",
        "target_schema": {
            "model_name": "TestModel",
            "fields": [
                {"name": "name", "type": "string", "required": True},
                {"name": "email", "type": "string", "required": True}
            ]
        },
        "conversation_history": [],
        "current_data": {}
    }


@pytest.fixture
def sample_chat_response() -> Dict[str, Any]:
    """Sample chat response data for testing."""
    return {
        "message": "I've extracted the name 'John Doe' from your message. What email address would you like to use?",
        "structured_data": {"name": "John Doe"},
        "is_complete": False,
        "follow_up_questions": ["What is your email address?"],
        "conversation_id": "test-conversation-123"
    }


@pytest.fixture
def sample_api_forward_request() -> Dict[str, Any]:
    """Sample API forward request data for testing."""
    return {
        "api_url": "https://httpbin.org/post",
        "method": "POST",
        "data": {"name": "John Doe", "email": "john@example.com"},
        "headers": {"Content-Type": "application/json"},
        "timeout": 30
    }


@pytest.fixture
def sample_api_forward_response() -> Dict[str, Any]:
    """Sample API forward response data for testing."""
    return {
        "success": True,
        "status_code": 200,
        "response_data": {"json": {"name": "John Doe", "email": "john@example.com"}},
        "response_headers": {"Content-Type": "application/json"},
        "execution_time": 0.5
    }


@pytest.fixture
def mock_openai_client() -> Mock:
    """Mock OpenAI client for testing."""
    mock_client = Mock()
    mock_client.chat = Mock()
    mock_client.chat.completions = Mock()
    mock_client.chat.completions.create = AsyncMock()
    return mock_client


@pytest.fixture
def mock_httpx_client() -> Mock:
    """Mock httpx client for testing."""
    mock_client = Mock()
    mock_client.request = AsyncMock()
    mock_response = Mock()
    mock_response.status_code = 200
    mock_response.headers = {"Content-Type": "application/json"}
    mock_response.json.return_value = {"success": True}
    mock_response.text = '{"success": true}'
    mock_client.request.return_value = mock_response
    return mock_client


# Environment setup for testing
@pytest.fixture(autouse=True)
def setup_test_environment(monkeypatch):
    """Setup test environment variables."""
    monkeypatch.setenv("OPENAI_API_KEY", "test-api-key")
    monkeypatch.setenv("OPENAI_MODEL", "gpt-4o-2024-10-21")
    monkeypatch.setenv("ALLOWED_ORIGINS", "http://localhost:3000")