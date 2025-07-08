"""
Tests for the OpenAIService.

This module tests the functionality of the OpenAI integration service
for converting natural language to structured data.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import json

from services.openai_service import OpenAIService, ChatResponse
from core.exceptions import OpenAIServiceError


class TestOpenAIService:
    """Test cases for OpenAIService."""
    
    @pytest.fixture
    def openai_service(self, mock_openai_client):
        """Create an OpenAIService instance with mocked client."""
        with patch('services.openai_service.OpenAI') as mock_openai_class:
            mock_openai_class.return_value = mock_openai_client
            service = OpenAIService()
            return service
    
    @pytest.mark.asyncio
    async def test_process_chat_success(self, openai_service, mock_openai_client, sample_schema_data):
        """Test successful chat processing."""
        # Mock OpenAI response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "message": "I've extracted your information. What's your email?",
            "structured_data": {"name": "John Doe"},
            "is_complete": False,
            "follow_up_questions": ["What is your email address?"]
        })
        mock_openai_client.chat.completions.create.return_value = mock_response
        
        result = await openai_service.process_chat(
            user_message="My name is John Doe",
            target_schema=sample_schema_data,
            conversation_history=[],
            current_data={}
        )
        
        assert isinstance(result, ChatResponse)
        assert result.message == "I've extracted your information. What's your email?"
        assert result.structured_data == {"name": "John Doe"}
        assert result.is_complete is False
        assert len(result.follow_up_questions) == 1
        assert result.conversation_id is not None
    
    @pytest.mark.asyncio
    async def test_process_chat_with_conversation_history(self, openai_service, mock_openai_client, sample_schema_data):
        """Test chat processing with existing conversation history."""
        conversation_history = [
            {
                "role": "user",
                "content": "I want to create a user profile",
                "timestamp": "2024-01-01T10:00:00"
            },
            {
                "role": "assistant", 
                "content": "Great! What's your name?",
                "timestamp": "2024-01-01T10:00:01"
            }
        ]
        
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "message": "Perfect! Now what's your email address?",
            "structured_data": {"name": "John Doe"},
            "is_complete": False,
            "follow_up_questions": ["What is your email address?"]
        })
        mock_openai_client.chat.completions.create.return_value = mock_response
        
        result = await openai_service.process_chat(
            user_message="My name is John Doe",
            target_schema=sample_schema_data,
            conversation_history=conversation_history,
            current_data={}
        )
        
        # Verify the conversation history was included in the API call
        call_args = mock_openai_client.chat.completions.create.call_args
        messages = call_args[1]['messages']
        
        # Should include system message + conversation history + new user message
        assert len(messages) >= 4  # system + 2 history + 1 new
        assert any(msg['role'] == 'user' and 'John Doe' in msg['content'] for msg in messages)
    
    @pytest.mark.asyncio
    async def test_process_chat_with_current_data(self, openai_service, mock_openai_client, sample_schema_data):
        """Test chat processing with existing form data."""
        current_data = {"name": "John Doe", "age": 30}
        
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "message": "I see you already have a name and age. What's your email?",
            "structured_data": {"name": "John Doe", "age": 30, "email": "john@example.com"},
            "is_complete": False,
            "follow_up_questions": []
        })
        mock_openai_client.chat.completions.create.return_value = mock_response
        
        result = await openai_service.process_chat(
            user_message="My email is john@example.com",
            target_schema=sample_schema_data,
            conversation_history=[],
            current_data=current_data
        )
        
        assert result.structured_data["name"] == "John Doe"
        assert result.structured_data["age"] == 30
        assert result.structured_data["email"] == "john@example.com"
    
    @pytest.mark.asyncio
    async def test_process_chat_complete_form(self, openai_service, mock_openai_client, sample_schema_data):
        """Test chat processing when form is complete."""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "message": "Perfect! Your profile is now complete.",
            "structured_data": {
                "name": "John Doe",
                "email": "john@example.com", 
                "age": 30,
                "role": "user",
                "is_active": True
            },
            "is_complete": True,
            "follow_up_questions": []
        })
        mock_openai_client.chat.completions.create.return_value = mock_response
        
        result = await openai_service.process_chat(
            user_message="I'm 30 years old and want the user role",
            target_schema=sample_schema_data,
            conversation_history=[],
            current_data={"name": "John Doe", "email": "john@example.com"}
        )
        
        assert result.is_complete is True
        assert len(result.follow_up_questions) == 0
        assert result.message == "Perfect! Your profile is now complete."
    
    @pytest.mark.asyncio
    async def test_process_chat_openai_api_error(self, openai_service, mock_openai_client, sample_schema_data):
        """Test handling OpenAI API errors."""
        mock_openai_client.chat.completions.create.side_effect = Exception("API Error")
        
        with pytest.raises(OpenAIServiceError) as exc_info:
            await openai_service.process_chat(
                user_message="Test message",
                target_schema=sample_schema_data,
                conversation_history=[],
                current_data={}
            )
        
        assert "OpenAI API error" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_process_chat_invalid_json_response(self, openai_service, mock_openai_client, sample_schema_data):
        """Test handling invalid JSON response from OpenAI."""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = "This is not valid JSON"
        mock_openai_client.chat.completions.create.return_value = mock_response
        
        with pytest.raises(OpenAIServiceError) as exc_info:
            await openai_service.process_chat(
                user_message="Test message",
                target_schema=sample_schema_data,
                conversation_history=[],
                current_data={}
            )
        
        assert "Failed to parse OpenAI response" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_process_chat_missing_required_fields(self, openai_service, mock_openai_client, sample_schema_data):
        """Test handling response missing required fields."""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "message": "Response without required fields"
            # Missing structured_data, is_complete, etc.
        })
        mock_openai_client.chat.completions.create.return_value = mock_response
        
        with pytest.raises(OpenAIServiceError) as exc_info:
            await openai_service.process_chat(
                user_message="Test message",
                target_schema=sample_schema_data,
                conversation_history=[],
                current_data={}
            )
        
        assert "Invalid response format" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_build_system_prompt(self, openai_service, sample_schema_data):
        """Test system prompt generation."""
        prompt = openai_service._build_system_prompt(sample_schema_data)
        
        assert "JSON schema" in prompt
        assert "TestModel" in prompt
        assert "name" in prompt
        assert "email" in prompt
        assert "structured_data" in prompt
        assert "is_complete" in prompt
    
    @pytest.mark.asyncio
    async def test_format_conversation_history(self, openai_service):
        """Test conversation history formatting."""
        history = [
            {
                "role": "user",
                "content": "Hello",
                "timestamp": "2024-01-01T10:00:00"
            },
            {
                "role": "assistant",
                "content": "Hi there!",
                "timestamp": "2024-01-01T10:00:01"
            }
        ]
        
        formatted = openai_service._format_conversation_history(history)
        
        assert len(formatted) == 2
        assert formatted[0]["role"] == "user"
        assert formatted[0]["content"] == "Hello"
        assert formatted[1]["role"] == "assistant"
        assert formatted[1]["content"] == "Hi there!"
    
    @pytest.mark.asyncio
    async def test_generate_conversation_id(self, openai_service):
        """Test conversation ID generation."""
        conv_id = openai_service._generate_conversation_id()
        
        assert isinstance(conv_id, str)
        assert len(conv_id) > 0
        assert conv_id.startswith("conv_")
    
    @pytest.mark.asyncio
    async def test_validate_response_structure_valid(self, openai_service):
        """Test response structure validation with valid data."""
        valid_response = {
            "message": "Test message",
            "structured_data": {"name": "John"},
            "is_complete": False,
            "follow_up_questions": ["What's your email?"]
        }
        
        # Should not raise an exception
        openai_service._validate_response_structure(valid_response)
    
    @pytest.mark.asyncio
    async def test_validate_response_structure_invalid(self, openai_service):
        """Test response structure validation with invalid data."""
        invalid_response = {
            "message": "Test message"
            # Missing required fields
        }
        
        with pytest.raises(OpenAIServiceError) as exc_info:
            openai_service._validate_response_structure(invalid_response)
        
        assert "Invalid response format" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_process_chat_empty_message(self, openai_service, sample_schema_data):
        """Test processing with empty message."""
        with pytest.raises(OpenAIServiceError) as exc_info:
            await openai_service.process_chat(
                user_message="",
                target_schema=sample_schema_data,
                conversation_history=[],
                current_data={}
            )
        
        assert "User message cannot be empty" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_process_chat_none_schema(self, openai_service):
        """Test processing with None schema."""
        with pytest.raises(OpenAIServiceError) as exc_info:
            await openai_service.process_chat(
                user_message="Test message",
                target_schema=None,
                conversation_history=[],
                current_data={}
            )
        
        assert "Target schema cannot be None" in str(exc_info.value)