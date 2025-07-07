"""
OpenAI service for natural language processing in the Chat Bot App.

This service handles OpenAI API integration for converting natural language
input into structured data using OpenAI's structured output feature.
"""

import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

from openai import AsyncOpenAI
from pydantic import BaseModel

from core.config import settings
from core.exceptions import OpenAIServiceError
from models.schemas import ConversationMessage


logger = logging.getLogger(__name__)


class ChatResult(BaseModel):
    """
    Result from OpenAI chat processing.
    
    Args:
        message: AI assistant's response message
        structured_data: Extracted structured data
        is_complete: Whether all required fields are filled
        follow_up_questions: Questions for missing information
        conversation_id: Unique conversation identifier
    """
    message: str
    structured_data: Optional[Dict[str, Any]] = None
    is_complete: bool = False
    follow_up_questions: List[str] = []
    conversation_id: str


class OpenAIService:
    """
    Service for OpenAI API integration and natural language processing.
    
    This service handles conversation management, structured output generation,
    and iterative data collection through natural language interactions.
    """
    
    def __init__(self):
        """Initialize the OpenAI service."""
        if not settings.OPENAI_API_KEY:
            raise OpenAIServiceError(
                message="OpenAI API key not configured",
                details={"error": "OPENAI_API_KEY environment variable not set"}
            )
        
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        
        # Conversation storage (in production, use Redis or database)
        self.conversations: Dict[str, List[ConversationMessage]] = {}
    
    async def process_chat(
        self,
        user_message: str,
        target_schema: Dict[str, Any],
        conversation_history: List[ConversationMessage] = None,
        current_data: Optional[Dict[str, Any]] = None
    ) -> ChatResult:
        """
        Process user message and extract structured data.
        
        Args:
            user_message: User's natural language input
            target_schema: Schema definition for the target model
            conversation_history: Previous conversation messages
            current_data: Partially filled form data
            
        Returns:
            ChatResult with response and extracted data
            
        Raises:
            OpenAIServiceError: If OpenAI API call fails
        """
        try:
            conversation_id = str(uuid.uuid4())
            logger.info(f"Processing chat for conversation {conversation_id}")
            
            # Prepare conversation context
            messages = self._prepare_messages(
                user_message=user_message,
                target_schema=target_schema,
                conversation_history=conversation_history or [],
                current_data=current_data
            )
            
            # Create structured output schema
            response_schema = self._create_response_schema(target_schema)
            
            # Call OpenAI with structured output
            response = await self._call_openai_structured(
                messages=messages,
                response_schema=response_schema
            )
            
            # Process the response
            result = self._process_openai_response(
                response=response,
                target_schema=target_schema,
                conversation_id=conversation_id
            )
            
            logger.info(f"Chat processing completed for {conversation_id}")
            return result
            
        except Exception as e:
            logger.error(f"OpenAI service error: {str(e)}")
            raise OpenAIServiceError(
                message=f"Failed to process chat: {str(e)}",
                api_error=str(e)
            )
    
    def _prepare_messages(
        self,
        user_message: str,
        target_schema: Dict[str, Any],
        conversation_history: List[ConversationMessage],
        current_data: Optional[Dict[str, Any]]
    ) -> List[Dict[str, str]]:
        """
        Prepare messages for OpenAI API call.
        
        Args:
            user_message: Current user message
            target_schema: Target schema information
            conversation_history: Previous messages
            current_data: Current form data
            
        Returns:
            List of messages for OpenAI API
        """
        system_prompt = self._create_system_prompt(target_schema, current_data)
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history
        for msg in conversation_history:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        return messages
    
    def _create_system_prompt(
        self,
        target_schema: Dict[str, Any],
        current_data: Optional[Dict[str, Any]]
    ) -> str:
        """
        Create system prompt for OpenAI.
        
        Args:
            target_schema: Target schema information
            current_data: Current form data
            
        Returns:
            System prompt string
        """
        schema_description = self._format_schema_for_prompt(target_schema)
        current_data_str = json.dumps(current_data, indent=2) if current_data else "No data filled yet"
        
        return f"""You are a helpful assistant that extracts structured data from user conversations.

Your task is to help the user fill out a form with the following structure:
{schema_description}

Current form data:
{current_data_str}

Instructions:
1. Extract any relevant information from the user's message
2. Ask follow-up questions for missing required fields
3. Be conversational and helpful
4. Only ask for one or two pieces of information at a time
5. Validate data types (e.g., emails should be valid email addresses)
6. For enum fields, present the available options clearly
7. Return the updated structured data in your response

If the user provides information that doesn't match the expected format, politely explain what format is needed.
"""
    
    def _format_schema_for_prompt(self, target_schema: Dict[str, Any]) -> str:
        """
        Format schema information for the system prompt.
        
        Args:
            target_schema: Target schema information
            
        Returns:
            Formatted schema description
        """
        fields_info = []
        for field in target_schema.get("fields", []):
            field_desc = f"- {field['name']} ({field['type']})"
            if field.get('required'):
                field_desc += " *required*"
            if field.get('description'):
                field_desc += f": {field['description']}"
            if field.get('options'):
                field_desc += f" Options: {', '.join(field['options'])}"
            fields_info.append(field_desc)
        
        return f"""
Model: {target_schema.get('model_name', 'Unknown')}
Description: {target_schema.get('description', 'No description available')}

Fields:
{chr(10).join(fields_info)}
"""
    
    def _create_response_schema(self, target_schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create response schema for OpenAI structured output.
        
        Args:
            target_schema: Target schema information
            
        Returns:
            JSON schema for structured output
        """
        return {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "description": "Conversational response to the user"
                },
                "extracted_data": {
                    "type": "object",
                    "description": "Extracted structured data from the conversation"
                },
                "is_complete": {
                    "type": "boolean",
                    "description": "Whether all required fields have been filled"
                },
                "follow_up_questions": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Questions to ask for missing information"
                }
            },
            "required": ["message", "extracted_data", "is_complete", "follow_up_questions"]
        }
    
    async def _call_openai_structured(
        self,
        messages: List[Dict[str, str]],
        response_schema: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Call OpenAI API with structured output.
        
        Args:
            messages: Conversation messages
            response_schema: Expected response schema
            
        Returns:
            Structured response from OpenAI
            
        Raises:
            OpenAIServiceError: If API call fails
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "chat_response",
                        "schema": response_schema,
                        "strict": True
                    }
                },
                temperature=0.1,  # Low temperature for more consistent output
                max_tokens=2000
            )
            
            # Parse the structured response
            content = response.choices[0].message.content
            return json.loads(content)
            
        except Exception as e:
            raise OpenAIServiceError(
                message=f"OpenAI API call failed: {str(e)}",
                api_error=str(e)
            )
    
    def _process_openai_response(
        self,
        response: Dict[str, Any],
        target_schema: Dict[str, Any],
        conversation_id: str
    ) -> ChatResult:
        """
        Process OpenAI response into ChatResult.
        
        Args:
            response: OpenAI structured response
            target_schema: Target schema information
            conversation_id: Unique conversation identifier
            
        Returns:
            ChatResult object
        """
        return ChatResult(
            message=response.get("message", "I'm here to help you fill out the form."),
            structured_data=response.get("extracted_data"),
            is_complete=response.get("is_complete", False),
            follow_up_questions=response.get("follow_up_questions", []),
            conversation_id=conversation_id
        )
    
    async def get_conversation_history(self, conversation_id: str) -> List[ConversationMessage]:
        """
        Get conversation history by ID.
        
        Args:
            conversation_id: Unique conversation identifier
            
        Returns:
            List of conversation messages
        """
        return self.conversations.get(conversation_id, [])
    
    async def save_conversation_message(
        self,
        conversation_id: str,
        role: str,
        content: str
    ) -> None:
        """
        Save a message to conversation history.
        
        Args:
            conversation_id: Unique conversation identifier
            role: Message role (user or assistant)
            content: Message content
        """
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = []
        
        message = ConversationMessage(
            role=role,
            content=content,
            timestamp=datetime.now()
        )
        
        self.conversations[conversation_id].append(message)
    
    async def clear_conversation(self, conversation_id: str) -> None:
        """
        Clear conversation history.
        
        Args:
            conversation_id: Unique conversation identifier
        """
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]