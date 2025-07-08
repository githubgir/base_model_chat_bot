"""
Tests for the SchemaParserService.

This module tests the functionality of parsing Pydantic BaseModel definitions
and converting them to UI-friendly formats.
"""

import pytest
from unittest.mock import patch, Mock
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

from services.schema_parser import SchemaParserService
from core.exceptions import SchemaParsingError


class TestSchemaParserService:
    """Test cases for SchemaParserService."""
    
    @pytest.fixture
    def schema_parser(self):
        """Create a SchemaParserService instance."""
        return SchemaParserService()
    
    @pytest.mark.asyncio
    async def test_parse_simple_schema(self, schema_parser, sample_pydantic_model):
        """Test parsing a simple Pydantic model."""
        result = await schema_parser.parse_schema(
            model_definition=sample_pydantic_model,
            model_name="TestModel"
        )
        
        assert result["model_name"] == "TestModel"
        assert "fields" in result
        assert len(result["fields"]) == 6
        
        # Check specific fields
        name_field = next(f for f in result["fields"] if f["name"] == "name")
        assert name_field["type"] == "string"
        assert name_field["required"] is True
        assert name_field["description"] == "Full name of the user"
        
        # Check enum field
        role_field = next(f for f in result["fields"] if f["name"] == "role")
        assert role_field["type"] == "string"
        assert role_field["options"] == ["admin", "user", "guest"]
        
        # Check optional field
        bio_field = next(f for f in result["fields"] if f["name"] == "bio")
        assert bio_field["required"] is False
    
    @pytest.mark.asyncio
    async def test_parse_schema_with_nested_model(self, schema_parser):
        """Test parsing a schema with nested BaseModel."""
        nested_model = """
from pydantic import BaseModel, Field
from typing import List

class Address(BaseModel):
    street: str = Field(..., description="Street address")
    city: str = Field(..., description="City name")
    zip_code: str = Field(..., description="ZIP code")

class User(BaseModel):
    name: str = Field(..., description="User name")
    address: Address = Field(..., description="User address")
"""
        
        result = await schema_parser.parse_schema(nested_model, "User")
        
        # Find the address field
        address_field = next(f for f in result["fields"] if f["name"] == "address")
        assert address_field["type"] == "object"
        assert address_field["nested_schema"] is not None
        assert len(address_field["nested_schema"]["fields"]) == 3
    
    @pytest.mark.asyncio
    async def test_parse_schema_with_list_field(self, schema_parser):
        """Test parsing a schema with List field."""
        list_model = """
from pydantic import BaseModel, Field
from typing import List

class TaggedItem(BaseModel):
    name: str = Field(..., description="Item name")
    tags: List[str] = Field(..., description="List of tags")
"""
        
        result = await schema_parser.parse_schema(list_model, "TaggedItem")
        
        tags_field = next(f for f in result["fields"] if f["name"] == "tags")
        assert tags_field["type"] == "array"
    
    @pytest.mark.asyncio
    async def test_parse_invalid_schema(self, schema_parser):
        """Test parsing an invalid schema raises an exception."""
        invalid_model = "This is not valid Python code"
        
        with pytest.raises(SchemaParsingError) as exc_info:
            await schema_parser.parse_schema(invalid_model, "InvalidModel")
        
        assert "Failed to parse schema" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_parse_schema_without_basemodel(self, schema_parser):
        """Test parsing a schema that doesn't inherit from BaseModel."""
        non_basemodel = """
class RegularClass:
    def __init__(self, name: str):
        self.name = name
"""
        
        with pytest.raises(SchemaParsingError) as exc_info:
            await schema_parser.parse_schema(non_basemodel, "RegularClass")
        
        assert "not a valid Pydantic BaseModel" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_convert_field_type_string(self, schema_parser):
        """Test field type conversion for string fields."""
        field_info = {
            "type": "string",
            "description": "Test field",
            "default": None
        }
        
        result = schema_parser._convert_field_type(field_info, "test_field")
        
        assert result["type"] == "string"
        assert result["name"] == "test_field"
        assert result["description"] == "Test field"
    
    @pytest.mark.asyncio
    async def test_convert_field_type_integer(self, schema_parser):
        """Test field type conversion for integer fields."""
        field_info = {
            "type": "integer",
            "description": "Age field",
            "default": 0,
            "minimum": 0,
            "maximum": 120
        }
        
        result = schema_parser._convert_field_type(field_info, "age")
        
        assert result["type"] == "integer"
        assert result["default"] == 0
    
    @pytest.mark.asyncio
    async def test_convert_field_type_boolean(self, schema_parser):
        """Test field type conversion for boolean fields."""
        field_info = {
            "type": "boolean",
            "description": "Active status",
            "default": True
        }
        
        result = schema_parser._convert_field_type(field_info, "is_active")
        
        assert result["type"] == "boolean"
        assert result["default"] is True
    
    @pytest.mark.asyncio
    async def test_convert_field_type_enum(self, schema_parser):
        """Test field type conversion for enum fields."""
        field_info = {
            "type": "string",
            "enum": ["admin", "user", "guest"],
            "description": "User role",
            "default": "user"
        }
        
        result = schema_parser._convert_field_type(field_info, "role")
        
        assert result["type"] == "string"
        assert result["options"] == ["admin", "user", "guest"]
        assert result["default"] == "user"
    
    @pytest.mark.asyncio
    async def test_extract_model_info_basic(self, schema_parser):
        """Test extracting basic model information."""
        class TestModel(BaseModel):
            """Test model for testing."""
            name: str = Field(..., description="Test name")
        
        schema = TestModel.model_json_schema()
        result = schema_parser._extract_model_info(schema, "TestModel")
        
        assert result["model_name"] == "TestModel"
        assert result["title"] == "TestModel"
        assert result["description"] == "Test model for testing."
    
    @pytest.mark.asyncio
    async def test_list_available_schemas(self, schema_parser):
        """Test listing available schemas."""
        result = await schema_parser.list_available_schemas()
        
        # Should return an empty list for now as we don't have a schema registry
        assert isinstance(result, list)
    
    @pytest.mark.asyncio
    async def test_parse_schema_empty_definition(self, schema_parser):
        """Test parsing with empty model definition."""
        with pytest.raises(SchemaParsingError) as exc_info:
            await schema_parser.parse_schema("", "EmptyModel")
        
        assert "Model definition cannot be empty" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_parse_schema_empty_name(self, schema_parser):
        """Test parsing with empty model name."""
        with pytest.raises(SchemaParsingError) as exc_info:
            await schema_parser.parse_schema("class Test: pass", "")
        
        assert "Model name cannot be empty" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_parse_schema_with_default_values(self, schema_parser):
        """Test parsing schema with various default values."""
        model_with_defaults = """
from pydantic import BaseModel, Field
from typing import Optional

class ModelWithDefaults(BaseModel):
    name: str = Field("John Doe", description="Default name")
    age: int = Field(25, description="Default age")
    is_active: bool = Field(True, description="Default active status")
    description: Optional[str] = Field(None, description="Optional description")
"""
        
        result = await schema_parser.parse_schema(model_with_defaults, "ModelWithDefaults")
        
        name_field = next(f for f in result["fields"] if f["name"] == "name")
        assert name_field["default"] == "John Doe"
        
        age_field = next(f for f in result["fields"] if f["name"] == "age")
        assert age_field["default"] == 25
        
        active_field = next(f for f in result["fields"] if f["name"] == "is_active")
        assert active_field["default"] is True
        
        desc_field = next(f for f in result["fields"] if f["name"] == "description")
        assert desc_field["default"] is None
        assert desc_field["required"] is False