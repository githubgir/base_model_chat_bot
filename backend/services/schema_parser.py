"""
Pydantic schema parser service for the Chat Bot App.

This service handles parsing of Pydantic BaseModel definitions and converts
them to UI-friendly format for dynamic form generation.
"""

import json
import logging
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field, create_model
from pydantic.fields import FieldInfo
import inspect

from core.exceptions import SchemaParsingError
from models.schemas import FieldDefinition, ParsedSchema


logger = logging.getLogger(__name__)


class SchemaParserService:
    """
    Service for parsing Pydantic BaseModel schemas into UI-friendly format.
    
    This service takes Pydantic BaseModel definitions and converts them
    to structured data that can be used to generate dynamic forms.
    """
    
    def __init__(self):
        """Initialize the schema parser service."""
        self.supported_types = {
            'str': 'string',
            'int': 'integer',
            'float': 'number',
            'bool': 'boolean',
            'datetime': 'datetime',
            'date': 'date',
            'time': 'time',
            'list': 'array',
            'dict': 'object'
        }
    
    async def parse_schema(self, model_definition: str, model_name: str) -> Dict[str, Any]:
        """
        Parse a Pydantic BaseModel definition into UI-friendly format.
        
        Args:
            model_definition: String representation of the BaseModel
            model_name: Name of the model being parsed
            
        Returns:
            Dict containing parsed schema information
            
        Raises:
            SchemaParsingError: If schema parsing fails
        """
        try:
            logger.info(f"Parsing schema for model: {model_name}")
            
            # Create the model from the definition
            model_class = self._create_model_from_definition(model_definition, model_name)
            
            # Generate JSON schema
            json_schema = model_class.model_json_schema()
            
            # Convert to UI-friendly format
            parsed_schema = self._convert_to_ui_format(json_schema, model_name)
            
            logger.info(f"Successfully parsed schema for {model_name}")
            return parsed_schema
            
        except Exception as e:
            logger.error(f"Failed to parse schema for {model_name}: {str(e)}")
            raise SchemaParsingError(
                message=f"Failed to parse schema: {str(e)}",
                schema_name=model_name,
                details={"error": str(e)}
            )
    
    def _create_model_from_definition(self, model_definition: str, model_name: str) -> type[BaseModel]:
        """
        Create a Pydantic model from string definition.
        
        Args:
            model_definition: String representation of the BaseModel
            model_name: Name of the model
            
        Returns:
            Pydantic BaseModel class
            
        Raises:
            Exception: If model creation fails
        """
        try:
            # Create a namespace for execution
            namespace = {
                'BaseModel': BaseModel,
                'Field': Field,
                'Optional': Optional,
                'Union': Union,
                'List': List,
                'Dict': Dict,
                'Any': Any
            }
            
            # Execute the model definition
            exec(model_definition, namespace)
            
            # Find the model class in the namespace
            model_class = None
            for name, obj in namespace.items():
                if (inspect.isclass(obj) and 
                    issubclass(obj, BaseModel) and 
                    obj != BaseModel):
                    model_class = obj
                    break
            
            if model_class is None:
                raise ValueError(f"No BaseModel class found in definition")
            
            return model_class
            
        except Exception as e:
            raise Exception(f"Failed to create model from definition: {str(e)}")
    
    def _convert_to_ui_format(self, json_schema: Dict[str, Any], model_name: str) -> Dict[str, Any]:
        """
        Convert JSON schema to UI-friendly format.
        
        Args:
            json_schema: JSON schema from Pydantic
            model_name: Name of the model
            
        Returns:
            UI-friendly schema format
        """
        properties = json_schema.get('properties', {})
        required_fields = json_schema.get('required', [])
        
        fields = []
        for field_name, field_info in properties.items():
            field_def = self._parse_field_definition(
                field_name=field_name,
                field_info=field_info,
                required=field_name in required_fields
            )
            fields.append(field_def)
        
        return {
            'model_name': model_name,
            'title': json_schema.get('title', model_name),
            'description': json_schema.get('description', ''),
            'fields': [field.dict() for field in fields]
        }
    
    def _parse_field_definition(self, field_name: str, field_info: Dict[str, Any], required: bool) -> FieldDefinition:
        """
        Parse a single field definition.
        
        Args:
            field_name: Name of the field
            field_info: Field information from JSON schema
            required: Whether the field is required
            
        Returns:
            FieldDefinition object
        """
        field_type = field_info.get('type', 'string')
        
        # Handle enum types
        if 'enum' in field_info:
            return FieldDefinition(
                name=field_name,
                type='enum',
                required=required,
                default=field_info.get('default'),
                description=field_info.get('description'),
                options=field_info['enum']
            )
        
        # Handle array types
        if field_type == 'array':
            return FieldDefinition(
                name=field_name,
                type='array',
                required=required,
                default=field_info.get('default'),
                description=field_info.get('description')
            )
        
        # Handle object types (nested BaseModels)
        if field_type == 'object':
            nested_schema = None
            if 'properties' in field_info:
                nested_schema = self._convert_to_ui_format(field_info, f"{field_name}_nested")
            
            return FieldDefinition(
                name=field_name,
                type='object',
                required=required,
                default=field_info.get('default'),
                description=field_info.get('description'),
                nested_schema=nested_schema
            )
        
        # Handle basic types
        ui_type = self.supported_types.get(field_type, field_type)
        
        return FieldDefinition(
            name=field_name,
            type=ui_type,
            required=required,
            default=field_info.get('default'),
            description=field_info.get('description')
        )
    
    async def list_available_schemas(self) -> List[str]:
        """
        List all available schema templates.
        
        Returns:
            List of available schema names
        """
        # For now, return a list of example schemas
        # In a real implementation, this could read from a database or file system
        return [
            "UserProfile",
            "ProductOrder",
            "ContactForm",
            "SurveyResponse",
            "EmployeeRecord"
        ]
    
    def get_example_schema(self, schema_name: str) -> str:
        """
        Get example schema definition by name.
        
        Args:
            schema_name: Name of the schema
            
        Returns:
            String representation of the schema
            
        Raises:
            SchemaParsingError: If schema not found
        """
        examples = {
            "UserProfile": '''
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"

class UserProfile(BaseModel):
    """User profile information."""
    name: str = Field(..., description="Full name of the user")
    email: str = Field(..., description="Email address")
    age: int = Field(..., ge=18, le=120, description="Age in years")
    role: UserRole = Field(UserRole.USER, description="User role")
    bio: Optional[str] = Field(None, description="User biography")
    active: bool = Field(True, description="Whether user is active")
''',
            "ProductOrder": '''
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum
from datetime import datetime

class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"

class OrderItem(BaseModel):
    """Individual item in an order."""
    product_id: str = Field(..., description="Product identifier")
    quantity: int = Field(..., ge=1, description="Quantity ordered")
    price: float = Field(..., ge=0, description="Price per unit")

class ProductOrder(BaseModel):
    """Product order information."""
    order_id: str = Field(..., description="Unique order identifier")
    customer_email: str = Field(..., description="Customer email address")
    items: List[OrderItem] = Field(..., description="List of ordered items")
    status: OrderStatus = Field(OrderStatus.PENDING, description="Order status")
    notes: Optional[str] = Field(None, description="Additional notes")
    order_date: datetime = Field(default_factory=datetime.now, description="Order date")
'''
        }
        
        if schema_name not in examples:
            raise SchemaParsingError(
                message=f"Schema '{schema_name}' not found",
                schema_name=schema_name
            )
        
        return examples[schema_name]