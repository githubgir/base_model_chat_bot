# Voice Integration Documentation

## Overview

The Chat Bot App includes comprehensive voice-to-voice functionality that allows users to:

1. **Voice Input**: Speak their questions and commands instead of typing
2. **Voice Output**: Hear AI responses spoken aloud with customizable voice settings
3. **Real-time Transcription**: Convert speech to text using OpenAI's Whisper API
4. **Voice Settings**: Customize speech rate, pitch, and voice selection

## Architecture

### Core Components

1. **VoiceService** (`services/voiceService.js`)
   - Singleton service managing all voice operations
   - Handles audio recording, transcription, and text-to-speech
   - Manages user preferences and settings persistence

2. **VoiceButton** (`components/VoiceButton.js`)
   - Reusable voice input component with visual feedback
   - Shows recording duration and transcription status
   - Provides touch-to-talk functionality

3. **VoiceSettings** (`components/VoiceSettings.js`)
   - Modal component for configuring voice preferences
   - Speech rate and pitch adjustment sliders
   - Voice selection and feature toggles

### Voice Flow

```
User presses Voice Button
        ↓
Start Audio Recording (Expo Audio)
        ↓
User speaks (visual feedback shown)
        ↓
Stop Recording on button release
        ↓
Send audio to OpenAI Whisper API
        ↓
Receive transcription text
        ↓
Auto-send to chat interface
        ↓
AI processes and responds
        ↓
Response text spoken aloud (Expo Speech)
```

## Technical Implementation

### Audio Recording

- **Format**: M4A (AAC encoding) for cross-platform compatibility
- **Quality**: 44.1kHz sample rate, 128kbps bitrate
- **Duration**: Maximum 60 seconds (configurable)
- **Permissions**: Microphone access required

```javascript
// Recording configuration
const recordingOptions = {
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
    // ... additional iOS-specific settings
  },
};
```

### Speech Recognition

- **Provider**: OpenAI Whisper API
- **Language**: English (configurable)
- **Response Format**: Plain text
- **Error Handling**: Graceful fallback with user feedback

```javascript
// Transcription API call
const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ENV.OPENAI_API_KEY}`,
    'Content-Type': 'multipart/form-data',
  },
  body: formData,
});
```

### Text-to-Speech

- **Provider**: Expo Speech (native platform APIs)
- **Customization**: Rate, pitch, voice selection
- **Languages**: Platform-dependent available voices
- **Interruption**: Stop current speech when new speech starts

```javascript
// Speech synthesis
await Speech.speak(text, {
  rate: speechRate,        // 0.1 to 2.0
  pitch: speechPitch,      // 0.5 to 2.0
  language: 'en-US',
  voice: selectedVoice,    // Platform-specific voice ID
});
```

## Configuration

### Environment Variables

```bash
# Required for voice transcription
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# Voice feature configuration
EXPO_PUBLIC_ENABLE_VOICE_FEATURES=true
EXPO_PUBLIC_DEFAULT_SPEECH_RATE=1.0
EXPO_PUBLIC_DEFAULT_SPEECH_PITCH=1.0
EXPO_PUBLIC_MAX_RECORDING_TIME=60000
```

### App Permissions

Add to `app.json`:

```json
{
  "expo": {
    "permissions": [
      "RECORD_AUDIO"
    ],
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "This app needs access to microphone for voice input functionality."
      }
    },
    "android": {
      "permissions": [
        "android.permission.RECORD_AUDIO"
      ]
    }
  }
}
```

## Usage Examples

### Basic Voice Button

```jsx
import VoiceButton from './components/VoiceButton';

<VoiceButton
  onTranscription={(text) => {
    console.log('Transcribed:', text);
    // Handle the transcribed text
  }}
  onError={(error) => {
    Alert.alert('Voice Error', error);
  }}
  size="medium"
  disabled={false}
/>
```

### Voice Settings Integration

```jsx
import VoiceSettings from './components/VoiceSettings';

<VoiceSettings
  visible={settingsVisible}
  onClose={() => setSettingsVisible(false)}
  onSettingsChange={(settings) => {
    console.log('Voice settings changed:', settings);
  }}
/>
```

### Programmatic Voice Operations

```javascript
import VoiceService from './services/voiceService';

// Initialize voice service
await VoiceService.initialize();

// Start recording
await VoiceService.startRecording();

// Stop and transcribe
const audioUri = await VoiceService.stopRecording();
const transcription = await VoiceService.transcribeAudio(audioUri);

// Speak text
await VoiceService.speak('Hello, this is a test message');

// Adjust settings
VoiceService.setSpeechRate(1.2);
VoiceService.setSpeechPitch(0.8);
```

## Error Handling

### Common Error Scenarios

1. **Microphone Permission Denied**
   ```javascript
   // Error: "Audio recording permission denied"
   // Solution: Request permissions and guide user to settings
   ```

2. **OpenAI API Key Missing**
   ```javascript
   // Error: "OpenAI API key not configured"
   // Solution: Set EXPO_PUBLIC_OPENAI_API_KEY environment variable
   ```

3. **Network Connectivity Issues**
   ```javascript
   // Error: "Transcription failed: 500 Internal Server Error"
   // Solution: Check network connection and API status
   ```

4. **Audio Recording Failure**
   ```javascript
   // Error: "Failed to start recording"
   // Solution: Check device capabilities and permissions
   ```

### Error Recovery

- Graceful degradation when voice features are unavailable
- User-friendly error messages with actionable guidance
- Automatic cleanup of audio files on errors
- Retry mechanisms for network-related failures

## Performance Considerations

### Optimization Strategies

1. **Audio File Management**
   - Automatic cleanup of temporary audio files
   - Efficient audio encoding settings
   - Memory management during recording

2. **API Usage**
   - Request throttling to avoid rate limits
   - Error handling for API failures
   - Cached voice settings persistence

3. **User Experience**
   - Visual feedback during recording and processing
   - Cancellation support for long operations
   - Responsive UI during voice operations

### Resource Usage

- **Storage**: Temporary audio files (~100KB per 10 seconds)
- **Network**: API calls to OpenAI Whisper (~1MB per minute of audio)
- **Battery**: Recording and processing impact minimal
- **Memory**: Audio buffers and processing temporary usage

## Testing

### Unit Tests

Test voice service functionality:

```javascript
describe('VoiceService', () => {
  test('should initialize correctly', async () => {
    const result = await VoiceService.initialize();
    expect(result).toBe(true);
  });

  test('should handle recording lifecycle', async () => {
    await VoiceService.startRecording();
    expect(VoiceService.getIsRecording()).toBe(true);
    
    const audioUri = await VoiceService.stopRecording();
    expect(audioUri).toBeTruthy();
    expect(VoiceService.getIsRecording()).toBe(false);
  });
});
```

### Integration Tests

Test voice button component:

```javascript
describe('VoiceButton', () => {
  test('should handle voice input flow', async () => {
    const onTranscription = jest.fn();
    const { getByRole } = render(
      <VoiceButton onTranscription={onTranscription} />
    );
    
    const button = getByRole('button');
    fireEvent.press(button);
    
    // Simulate recording and transcription
    await waitFor(() => {
      expect(onTranscription).toHaveBeenCalledWith('test transcription');
    });
  });
});
```

### Manual Testing Checklist

- [ ] Microphone permission request flow
- [ ] Voice recording with visual feedback
- [ ] Transcription accuracy with different accents
- [ ] Text-to-speech with various settings
- [ ] Voice settings persistence across app restarts
- [ ] Error handling for network failures
- [ ] Performance on different device types
- [ ] Accessibility with screen readers

## Platform-Specific Considerations

### iOS

- **Privacy**: NSMicrophoneUsageDescription required
- **Audio Session**: Handles interruptions (calls, notifications)
- **Background**: Recording stops when app backgrounds
- **Voices**: High-quality system voices available

### Android

- **Permissions**: Runtime permission handling required
- **Audio Focus**: Manages audio focus with other apps
- **Doze Mode**: May affect background operations
- **Voices**: Variable quality across devices and Android versions

### Web (Expo Web)

- **WebRTC**: Uses Web Audio API for recording
- **HTTPS**: Required for microphone access in browsers
- **Browser Support**: Modern browsers with MediaRecorder API
- **File Handling**: Different audio format considerations

## Security and Privacy

### Data Handling

- **Local Processing**: Audio files processed locally when possible
- **Temporary Storage**: Audio files deleted immediately after processing
- **API Security**: Secure transmission to OpenAI API with API key
- **No Persistent Storage**: Voice data not stored permanently

### Privacy Compliance

- **User Consent**: Clear permission requests and explanations
- **Data Minimization**: Only process audio for transcription
- **Transparency**: Clear indication when recording is active
- **User Control**: Easy disable/enable of voice features

## Troubleshooting

### Common Issues

1. **"Microphone not available"**
   - Check device has microphone
   - Verify app permissions
   - Restart app and retry

2. **"Transcription taking too long"**
   - Check network connectivity
   - Verify OpenAI API key validity
   - Try shorter recordings

3. **"Voice sounds robotic"**
   - Adjust speech rate and pitch settings
   - Try different available voices
   - Check device audio output settings

4. **"Recording button not responsive"**
   - Ensure voice features are enabled
   - Check for app crashes or freezes
   - Verify audio session initialization

### Debug Tools

Enable debug logging:

```javascript
// In config/env.js
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_ENABLE_LOGGING=true
```

This enables detailed console logs for voice operations and API calls.

## Future Enhancements

### Planned Features

1. **Offline Transcription**: Local speech recognition for privacy
2. **Voice Training**: User-specific voice recognition improvements
3. **Multi-language Support**: Dynamic language detection and switching
4. **Voice Shortcuts**: Custom voice commands for app functions
5. **Conversation Memory**: Context-aware voice interactions
6. **Voice Analytics**: Usage patterns and improvement suggestions

### Integration Opportunities

- **Smart Speakers**: Alexa/Google Assistant integration
- **Car Integration**: Android Auto/CarPlay voice support
- **Accessibility**: Enhanced screen reader integration
- **AI Assistants**: Integration with other AI services