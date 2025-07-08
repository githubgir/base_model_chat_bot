/**
 * Voice Button Component
 * 
 * A reusable button component for voice input with visual feedback,
 * recording duration display, and status indicators.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  Alert,
  ActivityIndicator
} from 'react-native';
import VoiceService from '../services/voiceService';
import ENV from '../config/env';

const VoiceButton = ({ 
  onTranscription, 
  onError, 
  disabled = false,
  size = 'large',
  style = {},
  showDuration = true,
  maxRecordingTime = ENV.MAX_RECORDING_TIME,
  transcriptionPlaceholder = "Listening..."
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  // Timers
  const durationTimer = useRef(null);
  const maxTimeTimer = useRef(null);

  useEffect(() => {
    initializeVoiceService();
    
    return () => {
      // Cleanup on unmount
      clearTimers();
      VoiceService.cleanup();
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      startPulseAnimation();
      startDurationTimer();
      startMaxTimeTimer();
    } else {
      stopPulseAnimation();
      clearTimers();
    }
  }, [isRecording]);

  const initializeVoiceService = async () => {
    try {
      await VoiceService.initialize();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      if (onError) {
        onError('Failed to initialize voice recording. Please check microphone permissions.');
      }
    }
  };

  const startPulseAnimation = () => {
    const pulseSequence = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    const opacitySequence = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    pulseSequence.start();
    opacitySequence.start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    opacityAnim.stopAnimation();
    
    // Reset to original values
    Animated.parallel([
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startDurationTimer = () => {
    setRecordingDuration(0);
    durationTimer.current = setInterval(async () => {
      try {
        const duration = await VoiceService.getRecordingDuration();
        setRecordingDuration(duration);
      } catch (error) {
        console.error('Failed to get recording duration:', error);
      }
    }, 100);
  };

  const startMaxTimeTimer = () => {
    maxTimeTimer.current = setTimeout(() => {
      handleStopRecording();
      Alert.alert(
        'Recording Limit Reached',
        `Maximum recording time of ${maxRecordingTime / 1000} seconds reached.`
      );
    }, maxRecordingTime);
  };

  const clearTimers = () => {
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }
    if (maxTimeTimer.current) {
      clearTimeout(maxTimeTimer.current);
      maxTimeTimer.current = null;
    }
  };

  const handleStartRecording = async () => {
    if (!isInitialized) {
      Alert.alert('Error', 'Voice service not initialized. Please try again.');
      return;
    }

    try {
      await VoiceService.startRecording();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      if (onError) {
        onError('Failed to start recording. Please check microphone permissions.');
      }
    }
  };

  const handleStopRecording = async () => {
    if (!isRecording) return;

    try {
      setIsTranscribing(true);
      
      // Stop recording and get audio file
      const audioUri = await VoiceService.stopRecording();
      setIsRecording(false);
      
      if (audioUri) {
        // Transcribe the audio
        const transcription = await VoiceService.transcribeAudio(audioUri);
        
        if (transcription && transcription.trim().length > 0) {
          if (onTranscription) {
            onTranscription(transcription);
          }
        } else {
          Alert.alert('No Speech Detected', 'Please try speaking more clearly.');
        }
      }
    } catch (error) {
      console.error('Failed to stop recording or transcribe:', error);
      if (onError) {
        onError('Failed to process voice input. Please try again.');
      }
    } finally {
      setIsTranscribing(false);
      setRecordingDuration(0);
    }
  };

  const handlePress = () => {
    if (disabled || isTranscribing) return;

    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const formatDuration = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}s`;
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { width: 50, height: 50, borderRadius: 25 };
      case 'medium':
        return { width: 65, height: 65, borderRadius: 32.5 };
      case 'large':
      default:
        return { width: 80, height: 80, borderRadius: 40 };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'medium':
        return 26;
      case 'large':
      default:
        return 32;
    }
  };

  const buttonSize = getButtonSize();
  const iconSize = getIconSize();

  const buttonStyle = [
    styles.voiceButton,
    buttonSize,
    {
      backgroundColor: isRecording ? '#ff4444' : '#007AFF',
      opacity: disabled ? 0.5 : 1,
    },
    style
  ];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          {
            transform: [{ scale: pulseAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
        <TouchableOpacity
          style={buttonStyle}
          onPress={handlePress}
          disabled={disabled || isTranscribing || !isInitialized}
          activeOpacity={0.8}
        >
          {isTranscribing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <View style={styles.iconContainer}>
              {isRecording ? (
                // Stop icon (square)
                <View style={[styles.stopIcon, { width: iconSize * 0.6, height: iconSize * 0.6 }]} />
              ) : (
                // Microphone icon (simplified)
                <View style={styles.microphoneIcon}>
                  <View style={[
                    styles.micBody, 
                    { 
                      width: iconSize * 0.4, 
                      height: iconSize * 0.6,
                      borderRadius: iconSize * 0.2
                    }
                  ]} />
                  <View style={[
                    styles.micStand,
                    {
                      width: iconSize * 0.6,
                      height: 2,
                      marginTop: iconSize * 0.1
                    }
                  ]} />
                  <View style={[
                    styles.micBase,
                    {
                      width: 2,
                      height: iconSize * 0.15,
                      marginTop: 1
                    }
                  ]} />
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
      
      {showDuration && isRecording && (
        <Text style={styles.durationText}>
          {formatDuration(recordingDuration)}
        </Text>
      )}
      
      {isTranscribing && (
        <Text style={styles.statusText}>
          {transcriptionPlaceholder}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIcon: {
    backgroundColor: 'white',
    borderRadius: 2,
  },
  microphoneIcon: {
    alignItems: 'center',
  },
  micBody: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'white',
  },
  micStand: {
    backgroundColor: 'white',
  },
  micBase: {
    backgroundColor: 'white',
  },
  durationText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#ff4444',
    textAlign: 'center',
  },
  statusText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
});

export default VoiceButton;