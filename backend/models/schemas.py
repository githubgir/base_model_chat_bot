"""
Request and response schemas for the Chat Bot App API.

This module defines Pydantic models for all API request and response schemas,
ensuring proper data validation and serialization.
"""

from pydantic import BaseModel, Field, validator
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
from enum import Enum


class HTTPMethod(str, Enum):
    """HTTP methods for API requests."""
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"


class SchemaParseRequest(BaseModel):
    """
    Request schema for parsing Pydantic BaseModel definitions.
    
    Args:
        model_definition: String representation of the Pydantic BaseModel
        model_name: Name of the model being parsed
    """
    model_definition: str = Field(..., description="Pydantic BaseModel definition as string")
    model_name: str = Field(..., description="Name of the model")
    
    @validator('model_definition')
    def validate_model_definition(cls, v):
        """Validate that model_definition is not empty."""
        if not v.strip():
            raise ValueError('model_definition cannot be empty')
        return v
    
    @validator('model_name')
    def validate_model_name(cls, v):
        """Validate that model_name is a valid identifier."""
        if not v.strip():
            raise ValueError('model_name cannot be empty')
        if not v.isidentifier():
            raise ValueError('model_name must be a valid Python identifier')
        return v


class SchemaParseResponse(BaseModel):
    """
    Response schema for parsed Pydantic BaseModel information.
    
    Args:
        model_name: Name of the parsed model
        schema: Parsed schema information in UI-friendly format
        success: Whether the parsing was successful
        error_message: Error message if parsing failed
    """
    model_name: str = Field(..., description="Name of the parsed model")
    schema: Dict[str, Any] = Field(..., description="Parsed schema information")
    success: bool = Field(True, description="Whether parsing was successful")
    error_message: Optional[str] = Field(None, description="Error message if parsing failed")


class ConversationMessage(BaseModel):
    """
    Individual message in a conversation.
    
    Args:
        role: Role of the message sender (user or assistant)
        content: Content of the message
        timestamp: When the message was created
    """
    role: str = Field(..., description="Role of the message sender")
    content: str = Field(..., description="Content of the message")
    timestamp: datetime = Field(default_factory=datetime.now, description="Message timestamp")
    
    @validator('role')
    def validate_role(cls, v):
        """Validate that role is either 'user' or 'assistant'."""
        if v not in ['user', 'assistant']:
            raise ValueError('role must be either "user" or "assistant"')
        return v


class ChatRequest(BaseModel):
    """
    Request schema for chat interactions with OpenAI.
    
    Args:
        message: User's message to process
        target_model: Name of the target Pydantic model
        target_schema: Schema information for the target model
        conversation_history: Previous messages in the conversation
        current_data: Current form data that has been filled
    """
    message: str = Field(..., description="User's message to process")
    target_model: str = Field(..., description="Name of the target Pydantic model")
    target_schema: Dict[str, Any] = Field(..., description="Schema information for the target model")
    conversation_history: List[ConversationMessage] = Field(
        default_factory=list, 
        description="Previous messages in the conversation"
    )
    current_data: Optional[Dict[str, Any]] = Field(
        None, 
        description="Current form data that has been filled"
    )
    
    @validator('message')
    def validate_message(cls, v):
        """Validate that message is not empty."""
        if not v.strip():
            raise ValueError('message cannot be empty')
        return v


class ChatResponse(BaseModel):
    """
    Response schema for chat interactions.
    
    Args:
        message: AI assistant's response message
        structured_data: Extracted structured data from the conversation
        is_complete: Whether all required fields have been filled
        follow_up_questions: Questions to ask the user for missing information
        conversation_id: Unique identifier for this conversation
    """
    message: str = Field(..., description="AI assistant's response message")
    structured_data: Optional[Dict[str, Any]] = Field(
        None, 
        description="Extracted structured data"
    )
    is_complete: bool = Field(False, description="Whether all required fields are filled")
    follow_up_questions: List[str] = Field(
        default_factory=list, 
        description="Questions for missing information"
    )
    conversation_id: str = Field(..., description="Unique conversation identifier")


class APIForwardRequest(BaseModel):
    """
    Request schema for forwarding data to external APIs.
    
    Args:
        api_url: URL of the external API endpoint
        method: HTTP method to use
        data: Data to send to the external API
        headers: HTTP headers to include
        timeout: Request timeout in seconds
    """
    api_url: str = Field(..., description="URL of the external API endpoint")
    method: HTTPMethod = Field(HTTPMethod.POST, description="HTTP method to use")
    data: Dict[str, Any] = Field(..., description="Data to send to the external API")
    headers: Optional[Dict[str, str]] = Field(
        None, 
        description="HTTP headers to include"
    )
    timeout: int = Field(30, description="Request timeout in seconds", ge=1, le=300)
    
    @validator('api_url')
    def validate_api_url(cls, v):
        """Validate that api_url is a valid URL."""
        if not v.startswith(('http://', 'https://')):
            raise ValueError('api_url must start with http:// or https://')
        return v


class APIForwardResponse(BaseModel):
    """
    Response schema for API forwarding results.
    
    Args:
        success: Whether the API call was successful
        status_code: HTTP status code from the external API
        response_data: Response data from the external API
        response_headers: Response headers from the external API
        execution_time: Time taken to execute the request in seconds
        error_message: Error message if the request failed
    """
    success: bool = Field(..., description="Whether the API call was successful")
    status_code: int = Field(..., description="HTTP status code from the external API")
    response_data: Optional[Union[Dict[str, Any], List[Any], str]] = Field(
        None, 
        description="Response data from the external API"
    )
    response_headers: Optional[Dict[str, str]] = Field(
        None, 
        description="Response headers from the external API"
    )
    execution_time: float = Field(..., description="Execution time in seconds")
    error_message: Optional[str] = Field(None, description="Error message if request failed")


class FieldDefinition(BaseModel):
    """
    Definition of a field in a parsed schema.
    
    Args:
        name: Field name
        type: Field type (string, integer, boolean, etc.)
        required: Whether the field is required
        default: Default value for the field
        description: Field description
        options: Available options for enum/literal fields
        nested_schema: Nested schema for BaseModel fields
    """
    name: str = Field(..., description="Field name")
    type: str = Field(..., description="Field type")
    required: bool = Field(True, description="Whether the field is required")
    default: Optional[Any] = Field(None, description="Default value")
    description: Optional[str] = Field(None, description="Field description")
    options: Optional[List[str]] = Field(None, description="Options for enum/literal fields")
    nested_schema: Optional[Dict[str, Any]] = Field(None, description="Nested schema for BaseModel fields")


class ParsedSchema(BaseModel):
    """
    Parsed schema information for UI generation.
    
    Args:
        model_name: Name of the model
        fields: List of field definitions
        title: Human-readable title for the model
        description: Model description
    """
    model_name: str = Field(..., description="Name of the model")
    fields: List[FieldDefinition] = Field(..., description="List of field definitions")
    title: Optional[str] = Field(None, description="Human-readable title")
    description: Optional[str] = Field(None, description="Model description")