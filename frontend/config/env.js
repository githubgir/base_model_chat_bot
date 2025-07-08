/**
 * Environment configuration for the frontend application.
 * 
 * This handles environment variables and API configurations
 * for different deployment environments.
 */

// Get environment variables from process.env or use defaults
const ENV = {
  // API Configuration
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
  
  // OpenAI Configuration (for voice transcription)
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
  
  // App Configuration
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Chat Bot App',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  
  // Development flags
  DEBUG_MODE: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  ENABLE_LOGGING: process.env.EXPO_PUBLIC_ENABLE_LOGGING !== 'false',
  
  // Voice Configuration
  DEFAULT_SPEECH_RATE: parseFloat(process.env.EXPO_PUBLIC_DEFAULT_SPEECH_RATE) || 1.0,
  DEFAULT_SPEECH_PITCH: parseFloat(process.env.EXPO_PUBLIC_DEFAULT_SPEECH_PITCH) || 1.0,
  MAX_RECORDING_TIME: parseInt(process.env.EXPO_PUBLIC_MAX_RECORDING_TIME) || 60000, // 60 seconds
  
  // Feature flags
  ENABLE_VOICE_FEATURES: process.env.EXPO_PUBLIC_ENABLE_VOICE_FEATURES !== 'false',
  ENABLE_OFFLINE_MODE: process.env.EXPO_PUBLIC_ENABLE_OFFLINE_MODE === 'true',
};

// Validation
const validateConfig = () => {
  const errors = [];
  
  if (!ENV.API_BASE_URL) {
    errors.push('API_BASE_URL is required');
  }
  
  if (ENV.ENABLE_VOICE_FEATURES && !ENV.OPENAI_API_KEY) {
    console.warn('Voice features enabled but OPENAI_API_KEY not provided. Voice transcription will not work.');
  }
  
  if (ENV.DEFAULT_SPEECH_RATE < 0.1 || ENV.DEFAULT_SPEECH_RATE > 2.0) {
    errors.push('DEFAULT_SPEECH_RATE must be between 0.1 and 2.0');
  }
  
  if (ENV.DEFAULT_SPEECH_PITCH < 0.5 || ENV.DEFAULT_SPEECH_PITCH > 2.0) {
    errors.push('DEFAULT_SPEECH_PITCH must be between 0.5 and 2.0');
  }
  
  if (errors.length > 0) {
    console.error('Environment configuration errors:', errors);
    throw new Error(`Configuration errors: ${errors.join(', ')}`);
  }
};

// Development helpers
const isDevelopment = () => {
  return process.env.NODE_ENV === 'development' || ENV.DEBUG_MODE;
};

const isProduction = () => {
  return process.env.NODE_ENV === 'production' && !ENV.DEBUG_MODE;
};

const log = (...args) => {
  if (ENV.ENABLE_LOGGING && isDevelopment()) {
    console.log('[ENV]', ...args);
  }
};

// Initialize configuration
const initializeConfig = () => {
  try {
    validateConfig();
    log('Environment configuration loaded successfully:', {
      API_BASE_URL: ENV.API_BASE_URL,
      ENABLE_VOICE_FEATURES: ENV.ENABLE_VOICE_FEATURES,
      DEBUG_MODE: ENV.DEBUG_MODE,
      NODE_ENV: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error('Failed to initialize environment configuration:', error);
    throw error;
  }
};

// Auto-initialize
initializeConfig();

export default ENV;

// Named exports for convenience
export const {
  API_BASE_URL,
  OPENAI_API_KEY,
  APP_NAME,
  APP_VERSION,
  DEBUG_MODE,
  ENABLE_LOGGING,
  DEFAULT_SPEECH_RATE,
  DEFAULT_SPEECH_PITCH,
  MAX_RECORDING_TIME,
  ENABLE_VOICE_FEATURES,
  ENABLE_OFFLINE_MODE,
} = ENV;

export {
  isDevelopment,
  isProduction,
  log,
};