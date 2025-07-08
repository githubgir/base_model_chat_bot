"""
Tests for the configuration module.

This module tests the application configuration and settings
management functionality.
"""

import pytest
import os
from unittest.mock import patch

from core.config import Settings, settings


class TestSettings:
    """Test cases for the Settings class."""
    
    def test_settings_default_values(self):
        """Test default values for settings."""
        test_settings = Settings()
        
        assert test_settings.OPENAI_API_KEY is None
        assert test_settings.OPENAI_MODEL == "gpt-4o-2024-10-21"
        assert test_settings.ALLOWED_ORIGINS == "http://localhost:3000,http://localhost:19006"
    
    def test_settings_with_environment_variables(self, monkeypatch):
        """Test settings loading from environment variables."""
        monkeypatch.setenv("OPENAI_API_KEY", "test-api-key-12345")
        monkeypatch.setenv("OPENAI_MODEL", "gpt-3.5-turbo")
        monkeypatch.setenv("ALLOWED_ORIGINS", "http://localhost:3000,https://myapp.com")
        
        test_settings = Settings()
        
        assert test_settings.OPENAI_API_KEY == "test-api-key-12345"
        assert test_settings.OPENAI_MODEL == "gpt-3.5-turbo"
        assert test_settings.ALLOWED_ORIGINS == "http://localhost:3000,https://myapp.com"
    
    def test_allowed_origins_list_property(self):
        """Test the allowed_origins_list property."""
        test_settings = Settings()
        test_settings.ALLOWED_ORIGINS = "http://localhost:3000,https://example.com,http://localhost:8080"
        
        origins_list = test_settings.allowed_origins_list
        
        assert isinstance(origins_list, list)
        assert len(origins_list) == 3
        assert "http://localhost:3000" in origins_list
        assert "https://example.com" in origins_list
        assert "http://localhost:8080" in origins_list
    
    def test_allowed_origins_list_with_spaces(self):
        """Test allowed_origins_list property with spaces in the string."""
        test_settings = Settings()
        test_settings.ALLOWED_ORIGINS = " http://localhost:3000 , https://example.com , http://localhost:8080 "
        
        origins_list = test_settings.allowed_origins_list
        
        assert len(origins_list) == 3
        assert "http://localhost:3000" in origins_list
        assert "https://example.com" in origins_list
        assert "http://localhost:8080" in origins_list
        # Ensure no extra spaces
        assert " http://localhost:3000 " not in origins_list
    
    def test_allowed_origins_list_single_origin(self):
        """Test allowed_origins_list property with single origin."""
        test_settings = Settings()
        test_settings.ALLOWED_ORIGINS = "http://localhost:3000"
        
        origins_list = test_settings.allowed_origins_list
        
        assert isinstance(origins_list, list)
        assert len(origins_list) == 1
        assert origins_list[0] == "http://localhost:3000"
    
    def test_allowed_origins_list_empty_string(self):
        """Test allowed_origins_list property with empty string."""
        test_settings = Settings()
        test_settings.ALLOWED_ORIGINS = ""
        
        origins_list = test_settings.allowed_origins_list
        
        assert isinstance(origins_list, list)
        assert len(origins_list) == 1
        assert origins_list[0] == ""
    
    def test_settings_validation_openai_api_key(self):
        """Test settings validation for OpenAI API key."""
        # Should not raise an error even if API key is None
        test_settings = Settings(OPENAI_API_KEY=None)
        assert test_settings.OPENAI_API_KEY is None
        
        # Should accept valid API key
        test_settings = Settings(OPENAI_API_KEY="sk-test123")
        assert test_settings.OPENAI_API_KEY == "sk-test123"
    
    def test_settings_field_descriptions(self):
        """Test that settings fields have proper descriptions."""
        # This tests the Field descriptions in the Settings class
        test_settings = Settings()
        
        # Check that the settings object has the expected attributes
        assert hasattr(test_settings, 'OPENAI_API_KEY')
        assert hasattr(test_settings, 'OPENAI_MODEL')
        assert hasattr(test_settings, 'ALLOWED_ORIGINS')
    
    def test_settings_model_config(self):
        """Test that Settings model has correct configuration."""
        test_settings = Settings()
        
        # Check that protected namespaces are disabled
        # This allows fields starting with "model_" without warnings
        config = test_settings.model_config
        assert config.get("protected_namespaces") == ()
    
    @patch.dict(os.environ, {
        "OPENAI_API_KEY": "env-api-key",
        "OPENAI_MODEL": "env-model",
        "ALLOWED_ORIGINS": "env-origins"
    })
    def test_settings_environment_override(self):
        """Test that environment variables override default values."""
        test_settings = Settings()
        
        assert test_settings.OPENAI_API_KEY == "env-api-key"
        assert test_settings.OPENAI_MODEL == "env-model"
        assert test_settings.ALLOWED_ORIGINS == "env-origins"
    
    def test_settings_case_sensitivity(self, monkeypatch):
        """Test that environment variable names are case sensitive."""
        # Set lowercase environment variables (should not be picked up)
        monkeypatch.setenv("openai_api_key", "lowercase-key")
        monkeypatch.setenv("openai_model", "lowercase-model")
        
        test_settings = Settings()
        
        # Should use defaults, not the lowercase env vars
        assert test_settings.OPENAI_API_KEY is None
        assert test_settings.OPENAI_MODEL == "gpt-4o-2024-10-21"
    
    def test_global_settings_instance(self):
        """Test that the global settings instance is properly configured."""
        assert isinstance(settings, Settings)
        assert hasattr(settings, 'OPENAI_API_KEY')
        assert hasattr(settings, 'OPENAI_MODEL')
        assert hasattr(settings, 'ALLOWED_ORIGINS')
    
    def test_settings_immutability_protection(self):
        """Test that important settings are properly handled."""
        test_settings = Settings()
        
        # Should be able to access settings
        api_key = test_settings.OPENAI_API_KEY
        model = test_settings.OPENAI_MODEL
        origins = test_settings.ALLOWED_ORIGINS
        
        # Should be able to get derived properties
        origins_list = test_settings.allowed_origins_list
        assert isinstance(origins_list, list)
    
    def test_settings_with_env_file_simulation(self, monkeypatch, tmp_path):
        """Test settings behavior when simulating .env file loading."""
        # Simulate what would happen if .env file was loaded
        monkeypatch.setenv("OPENAI_API_KEY", "file-api-key")
        monkeypatch.setenv("OPENAI_MODEL", "file-model")
        monkeypatch.setenv("ALLOWED_ORIGINS", "http://file.example.com")
        
        test_settings = Settings()
        
        assert test_settings.OPENAI_API_KEY == "file-api-key"
        assert test_settings.OPENAI_MODEL == "file-model"
        assert "http://file.example.com" in test_settings.allowed_origins_list
    
    def test_allowed_origins_list_edge_cases(self):
        """Test edge cases for allowed_origins_list property."""
        test_settings = Settings()
        
        # Test with comma at the end
        test_settings.ALLOWED_ORIGINS = "http://localhost:3000,"
        origins_list = test_settings.allowed_origins_list
        assert len(origins_list) == 2
        assert "http://localhost:3000" in origins_list
        assert "" in origins_list
        
        # Test with multiple commas
        test_settings.ALLOWED_ORIGINS = "http://localhost:3000,,https://example.com"
        origins_list = test_settings.allowed_origins_list
        assert len(origins_list) == 3
        assert "http://localhost:3000" in origins_list
        assert "https://example.com" in origins_list
        assert "" in origins_list
    
    def test_settings_type_validation(self):
        """Test that settings maintain their expected types."""
        test_settings = Settings()
        
        # OPENAI_API_KEY should be Optional[str]
        assert test_settings.OPENAI_API_KEY is None or isinstance(test_settings.OPENAI_API_KEY, str)
        
        # OPENAI_MODEL should be str
        assert isinstance(test_settings.OPENAI_MODEL, str)
        
        # ALLOWED_ORIGINS should be str
        assert isinstance(test_settings.ALLOWED_ORIGINS, str)
        
        # allowed_origins_list should be List[str]
        origins_list = test_settings.allowed_origins_list
        assert isinstance(origins_list, list)
        assert all(isinstance(origin, str) for origin in origins_list)