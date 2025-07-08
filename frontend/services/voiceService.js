/**
 * Voice Service for Speech-to-Text and Text-to-Speech functionality
 * 
 * This service handles voice input/output using Expo's Audio and Speech APIs,
 * along with OpenAI's Whisper API for speech recognition.
 */

import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../config/env';

class VoiceService {
  constructor() {
    this.recording = null;
    this.isRecording = false;
    this.isPlaying = false;
    this.speechRate = ENV.DEFAULT_SPEECH_RATE;
    this.speechPitch = ENV.DEFAULT_SPEECH_PITCH;
    this.recordingOptions = {
      android: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
    };
  }

  /**
   * Initialize audio permissions and settings
   */
  async initialize() {
    try {
      // Request audio recording permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio recording permission denied');
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load user preferences
      await this.loadUserPreferences();

      console.log('Voice service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      throw error;
    }
  }

  /**
   * Start recording audio
   */
  async startRecording() {
    try {
      if (this.isRecording) {
        console.warn('Already recording');
        return;
      }

      console.log('Starting recording...');
      
      // Create new recording instance
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(this.recordingOptions);
      
      // Start recording
      await this.recording.startAsync();
      this.isRecording = true;
      
      console.log('Recording started');
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.isRecording = false;
      this.recording = null;
      throw error;
    }
  }

  /**
   * Stop recording and return the audio file URI
   */
  async stopRecording() {
    try {
      if (!this.isRecording || !this.recording) {
        console.warn('Not currently recording');
        return null;
      }

      console.log('Stopping recording...');
      
      // Stop recording
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      // Reset recording state
      this.isRecording = false;
      this.recording = null;
      
      console.log('Recording stopped, file saved to:', uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.isRecording = false;
      this.recording = null;
      throw error;
    }
  }

  /**
   * Convert audio file to text using OpenAI Whisper API
   */
  async transcribeAudio(audioUri) {
    try {
      console.log('Transcribing audio file:', audioUri);

      if (!audioUri) {
        throw new Error('No audio URI provided');
      }

      // Read the audio file
      const audioFile = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create form data for OpenAI API
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      });
      formData.append('model', 'whisper-1');
      formData.append('language', 'en'); // Can be made configurable
      formData.append('response_format', 'text');

      // Check if API key is available
      if (!ENV.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your environment.');
      }

      // Make API call to OpenAI Whisper
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ENV.OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
      }

      const transcription = await response.text();
      console.log('Transcription result:', transcription);
      
      // Clean up the audio file
      await FileSystem.deleteAsync(audioUri, { idempotent: true });
      
      return transcription.trim();
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
      
      // Clean up the audio file on error
      if (audioUri) {
        try {
          await FileSystem.deleteAsync(audioUri, { idempotent: true });
        } catch (cleanupError) {
          console.error('Failed to clean up audio file:', cleanupError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Convert text to speech and play it
   */
  async speak(text, options = {}) {
    try {
      if (!text || text.trim().length === 0) {
        console.warn('No text provided for speech');
        return;
      }

      if (this.isPlaying) {
        console.log('Stopping current speech...');
        await Speech.stop();
      }

      console.log('Speaking text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));

      const speechOptions = {
        rate: options.rate || this.speechRate,
        pitch: options.pitch || this.speechPitch,
        language: options.language || 'en-US',
        voice: options.voice || null,
        onStart: () => {
          this.isPlaying = true;
          if (options.onStart) options.onStart();
        },
        onDone: () => {
          this.isPlaying = false;
          if (options.onDone) options.onDone();
        },
        onStopped: () => {
          this.isPlaying = false;
          if (options.onStopped) options.onStopped();
        },
        onError: (error) => {
          this.isPlaying = false;
          console.error('Speech error:', error);
          if (options.onError) options.onError(error);
        },
      };

      await Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('Failed to speak text:', error);
      this.isPlaying = false;
      throw error;
    }
  }

  /**
   * Stop current speech playback
   */
  async stopSpeaking() {
    try {
      if (this.isPlaying) {
        await Speech.stop();
        this.isPlaying = false;
        console.log('Speech stopped');
      }
    } catch (error) {
      console.error('Failed to stop speech:', error);
      this.isPlaying = false;
    }
  }

  /**
   * Check if currently recording
   */
  getIsRecording() {
    return this.isRecording;
  }

  /**
   * Check if currently playing speech
   */
  getIsPlaying() {
    return this.isPlaying;
  }

  /**
   * Get available voices for text-to-speech
   */
  async getAvailableVoices() {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices;
    } catch (error) {
      console.error('Failed to get available voices:', error);
      return [];
    }
  }

  /**
   * Set speech rate (0.1 to 2.0)
   */
  setSpeechRate(rate) {
    this.speechRate = Math.max(0.1, Math.min(2.0, rate));
    this.saveUserPreferences();
  }

  /**
   * Set speech pitch (0.5 to 2.0)
   */
  setSpeechPitch(pitch) {
    this.speechPitch = Math.max(0.5, Math.min(2.0, pitch));
    this.saveUserPreferences();
  }

  /**
   * Get current speech settings
   */
  getSpeechSettings() {
    return {
      rate: this.speechRate,
      pitch: this.speechPitch,
    };
  }

  /**
   * Save user preferences to async storage
   */
  async saveUserPreferences() {
    try {
      const preferences = {
        speechRate: this.speechRate,
        speechPitch: this.speechPitch,
      };
      await AsyncStorage.setItem('voiceServicePreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save voice preferences:', error);
    }
  }

  /**
   * Load user preferences from async storage
   */
  async loadUserPreferences() {
    try {
      const preferencesJson = await AsyncStorage.getItem('voiceServicePreferences');
      if (preferencesJson) {
        const preferences = JSON.parse(preferencesJson);
        this.speechRate = preferences.speechRate || 1.0;
        this.speechPitch = preferences.speechPitch || 1.0;
      }
    } catch (error) {
      console.error('Failed to load voice preferences:', error);
    }
  }

  /**
   * Check if the device supports speech recognition
   */
  async checkSpeechRecognitionSupport() {
    try {
      // For now, we assume support based on platform
      // This could be enhanced with actual capability detection
      return true;
    } catch (error) {
      console.error('Failed to check speech recognition support:', error);
      return false;
    }
  }

  /**
   * Get recording duration in milliseconds
   */
  async getRecordingDuration() {
    try {
      if (this.recording && this.isRecording) {
        const status = await this.recording.getStatusAsync();
        return status.durationMillis || 0;
      }
      return 0;
    } catch (error) {
      console.error('Failed to get recording duration:', error);
      return 0;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      // Stop any ongoing speech
      await this.stopSpeaking();
      
      // Stop any ongoing recording
      if (this.isRecording) {
        await this.stopRecording();
      }
      
      console.log('Voice service cleaned up');
    } catch (error) {
      console.error('Failed to cleanup voice service:', error);
    }
  }
}

// Export singleton instance
export default new VoiceService();