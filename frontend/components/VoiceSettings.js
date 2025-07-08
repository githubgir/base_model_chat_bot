/**
 * Voice Settings Component
 * 
 * A component for managing voice-to-speech settings including
 * speech rate, pitch, and voice selection.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import VoiceService from '../services/voiceService';

const VoiceSettings = ({ visible, onClose, onSettingsChange }) => {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCurrentSettings();
      loadAvailableVoices();
    }
  }, [visible]);

  const loadCurrentSettings = async () => {
    try {
      const settings = VoiceService.getSpeechSettings();
      setSpeechRate(settings.rate);
      setSpeechPitch(settings.pitch);
    } catch (error) {
      console.error('Failed to load voice settings:', error);
    }
  };

  const loadAvailableVoices = async () => {
    try {
      setIsLoading(true);
      const voices = await VoiceService.getAvailableVoices();
      setAvailableVoices(voices);
      
      // Set default voice if none selected
      if (!selectedVoice && voices.length > 0) {
        const defaultVoice = voices.find(v => v.language.startsWith('en')) || voices[0];
        setSelectedVoice(defaultVoice?.identifier);
      }
    } catch (error) {
      console.error('Failed to load available voices:', error);
      Alert.alert('Error', 'Failed to load available voices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateChange = (value) => {
    setSpeechRate(value);
    VoiceService.setSpeechRate(value);
    if (onSettingsChange) {
      onSettingsChange({ rate: value, pitch: speechPitch, voiceEnabled });
    }
  };

  const handlePitchChange = (value) => {
    setSpeechPitch(value);
    VoiceService.setSpeechPitch(value);
    if (onSettingsChange) {
      onSettingsChange({ rate: speechRate, pitch: value, voiceEnabled });
    }
  };

  const handleVoiceEnabledChange = (value) => {
    setVoiceEnabled(value);
    if (onSettingsChange) {
      onSettingsChange({ rate: speechRate, pitch: speechPitch, voiceEnabled: value });
    }
  };

  const testCurrentSettings = async () => {
    try {
      const testText = "This is a test of the current voice settings.";
      await VoiceService.speak(testText, {
        rate: speechRate,
        pitch: speechPitch,
        voice: selectedVoice,
      });
    } catch (error) {
      console.error('Failed to test voice settings:', error);
      Alert.alert('Error', 'Failed to test voice settings');
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all voice settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSpeechRate(1.0);
            setSpeechPitch(1.0);
            setVoiceEnabled(true);
            VoiceService.setSpeechRate(1.0);
            VoiceService.setSpeechPitch(1.0);
            if (onSettingsChange) {
              onSettingsChange({ rate: 1.0, pitch: 1.0, voiceEnabled: true });
            }
          }
        }
      ]
    );
  };

  const formatValue = (value, suffix = '') => {
    return `${value.toFixed(1)}${suffix}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Voice Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* Voice Output Toggle */}
            <View style={styles.settingItem}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingLabel}>Enable Voice Output</Text>
                <Switch
                  value={voiceEnabled}
                  onValueChange={handleVoiceEnabledChange}
                  trackColor={{ false: '#767577', true: '#007AFF' }}
                  thumbColor={voiceEnabled ? '#ffffff' : '#f4f3f4'}
                />
              </View>
              <Text style={styles.settingDescription}>
                Turn on to hear AI responses spoken aloud
              </Text>
            </View>

            {voiceEnabled && (
              <>
                {/* Speech Rate */}
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Speech Rate</Text>
                  <Text style={styles.settingDescription}>
                    How fast the voice speaks ({formatValue(speechRate, 'x')})
                  </Text>
                  <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>Slow</Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0.1}
                      maximumValue={2.0}
                      value={speechRate}
                      onValueChange={handleRateChange}
                      step={0.1}
                      minimumTrackTintColor="#007AFF"
                      maximumTrackTintColor="#d3d3d3"
                      thumbStyle={styles.sliderThumb}
                    />
                    <Text style={styles.sliderLabel}>Fast</Text>
                  </View>
                </View>

                {/* Speech Pitch */}
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Speech Pitch</Text>
                  <Text style={styles.settingDescription}>
                    How high or low the voice sounds ({formatValue(speechPitch, 'x')})
                  </Text>
                  <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>Low</Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0.5}
                      maximumValue={2.0}
                      value={speechPitch}
                      onValueChange={handlePitchChange}
                      step={0.1}
                      minimumTrackTintColor="#007AFF"
                      maximumTrackTintColor="#d3d3d3"
                      thumbStyle={styles.sliderThumb}
                    />
                    <Text style={styles.sliderLabel}>High</Text>
                  </View>
                </View>

                {/* Voice Selection */}
                {availableVoices.length > 0 && (
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Voice</Text>
                    <Text style={styles.settingDescription}>
                      Choose the voice for speech output
                    </Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={selectedVoice}
                        onValueChange={setSelectedVoice}
                        style={styles.picker}
                      >
                        {availableVoices.map((voice) => (
                          <Picker.Item
                            key={voice.identifier}
                            label={`${voice.name} (${voice.language})`}
                            value={voice.identifier}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                )}

                {/* Test Voice Button */}
                <TouchableOpacity style={styles.testButton} onPress={testCurrentSettings}>
                  <Text style={styles.testButtonText}>Test Voice Settings</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Recording Quality Info */}
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Recording Information</Text>
              <Text style={styles.infoText}>
                • Audio is recorded at 44.1kHz for high quality
              </Text>
              <Text style={styles.infoText}>
                • Recordings are processed using OpenAI Whisper
              </Text>
              <Text style={styles.infoText}>
                • Audio files are automatically deleted after processing
              </Text>
              <Text style={styles.infoText}>
                • Maximum recording time: 60 seconds
              </Text>
            </View>

          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
              <Text style={styles.resetButtonText}>Reset to Defaults</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  settingItem: {
    marginBottom: 25,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
    width: 40,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  sliderThumb: {
    backgroundColor: '#007AFF',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50,
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resetButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VoiceSettings;