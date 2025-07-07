"""
Configuration management for the Chat Bot App.

This module handles all configuration settings using Pydantic BaseSettings
for environment variable management and validation.
"""

from pydantic import Field
from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from dotenv import load_dotenv


# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    """
    Application settings with environment variable support.
    
    All settings can be overridden via environment variables.
    """
    
    # Application settings
    APP_NAME: str = Field(default="Chat Bot App API", description="Application name")
    VERSION: str = Field(default="1.0.0", description="Application version")
    DEBUG: bool = Field(default=False, description="Debug mode")
    
    # Server settings
    HOST: str = Field(default="0.0.0.0", description="Server host")
    PORT: int = Field(default=8000, description="Server port")
    
    # CORS settings
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:19006",
        description="Comma-separated list of allowed CORS origins"
    )
    
    # OpenAI settings
    OPENAI_API_KEY: Optional[str] = Field(
        default=None, 
        description="OpenAI API key for structured output"
    )
    OPENAI_MODEL: str = Field(
        default="gpt-4o-2024-10-21",
        description="OpenAI model for structured output"
    )
    
    # Rate limiting
    RATE_LIMIT_REQUESTS: int = Field(
        default=100,
        description="Number of requests per minute"
    )
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    
    class Config:
        """Pydantic configuration."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert comma-separated ALLOWED_ORIGINS to list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


# Global settings instance
settings = Settings()