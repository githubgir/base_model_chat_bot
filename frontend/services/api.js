/**
 * API service for communicating with the FastAPI backend.
 * 
 * This service handles all HTTP requests to the backend API and provides
 * a clean interface for the frontend components to interact with.
 */

import axios from 'axios';

// Base URL for the API - update this based on your backend deployment
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * API service class with methods for each backend endpoint
 */
class ApiService {
  /**
   * Parse a Pydantic BaseModel schema into UI-friendly format
   * @param {string} modelDefinition - The Pydantic BaseModel definition as string
   * @param {string} modelName - Name of the model
   * @returns {Promise<Object>} Parsed schema data
   */
  async parseSchema(modelDefinition, modelName) {
    try {
      const response = await apiClient.post('/parse-schema', {
        model_definition: modelDefinition,
        model_name: modelName
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to parse schema: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Send a chat message to the AI and get structured response
   * @param {string} message - User's message
   * @param {string} targetModel - Name of the target Pydantic model
   * @param {Object} targetSchema - Schema information for the target model
   * @param {Array} conversationHistory - Previous messages in the conversation
   * @param {Object} currentData - Current form data that has been filled
   * @returns {Promise<Object>} Chat response with structured data
   */
  async sendChatMessage(message, targetModel, targetSchema, conversationHistory = [], currentData = null) {
    try {
      const response = await apiClient.post('/chat', {
        message,
        target_model: targetModel,
        target_schema: targetSchema,
        conversation_history: conversationHistory,
        current_data: currentData
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to process chat: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Forward completed data to an external API
   * @param {string} apiUrl - URL of the external API endpoint
   * @param {string} method - HTTP method (GET, POST, PUT, etc.)
   * @param {Object} data - Data to send to the external API
   * @param {Object} headers - Additional headers to include
   * @param {number} timeout - Request timeout in seconds
   * @returns {Promise<Object>} Response from the external API
   */
  async forwardToExternalApi(apiUrl, method = 'POST', data = {}, headers = {}, timeout = 30) {
    try {
      const response = await apiClient.post('/forward', {
        api_url: apiUrl,
        method,
        data,
        headers,
        timeout
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to forward to external API: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Get list of available schema templates
   * @returns {Promise<Array>} List of available schema names
   */
  async getAvailableSchemas() {
    try {
      const response = await apiClient.get('/schemas');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get schemas: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Health check endpoint
   * @returns {Promise<Object>} Health status information
   */
  async healthCheck() {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.response?.data?.detail || error.message}`);
    }
  }
}

// Export a singleton instance
export default new ApiService();