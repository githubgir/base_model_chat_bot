/**
 * Chat Interface Component
 * 
 * This component provides a chat interface for users to interact with the AI
 * and convert natural language to structured data. It handles conversation
 * history, message display, and integration with the backend chat API.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import ApiService from '../services/api';

/**
 * Individual message component
 */
const ChatMessage = ({ message, isUser, timestamp }) => {
  return (
    <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.aiMessage]}>
      <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.aiMessageText]}>
        {message}
      </Text>
      <Text style={styles.timestamp}>
        {timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
      </Text>
    </View>
  );
};

/**
 * Follow-up questions component
 */
const FollowUpQuestions = ({ questions, onQuestionSelect }) => {
  if (!questions || questions.length === 0) return null;
  
  return (
    <View style={styles.followUpContainer}>
      <Text style={styles.followUpTitle}>Suggested questions:</Text>
      {questions.map((question, index) => (
        <TouchableOpacity
          key={index}
          style={styles.followUpQuestion}
          onPress={() => onQuestionSelect(question)}
        >
          <Text style={styles.followUpQuestionText}>{question}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

/**
 * Main ChatInterface component
 */
const ChatInterface = ({ 
  schema, 
  currentData, 
  onDataUpdate, 
  onComplete,
  placeholder = "Ask me anything about filling out this form..."
}) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const scrollViewRef = useRef(null);

  // Initialize with a welcome message
  useEffect(() => {
    if (schema && messages.length === 0) {
      const welcomeMessage = {
        role: 'assistant',
        content: `Hi! I'm here to help you fill out this form for ${schema.model_name || 'your data'}. Just tell me what you want to include and I'll help structure it properly. What would you like to start with?`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, [schema]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const sendMessage = async (message) => {
    if (!message.trim() || isLoading) return;
    
    // Add user message to conversation
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      // Prepare conversation history for API
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));
      
      // Send to backend
      const response = await ApiService.sendChatMessage(
        message,
        schema.model_name,
        schema,
        conversationHistory,
        currentData
      );
      
      // Add AI response to conversation
      const aiMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setConversationId(response.conversation_id);
      setFollowUpQuestions(response.follow_up_questions || []);
      setIsComplete(response.is_complete);
      
      // Update structured data if available
      if (response.structured_data && onDataUpdate) {
        onDataUpdate(response.structured_data);
      }
      
      // Notify parent if form is complete
      if (response.is_complete && onComplete) {
        onComplete(response.structured_data);
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    sendMessage(inputText);
  };

  const handleFollowUpQuestion = (question) => {
    setInputText(question);
    sendMessage(question);
  };

  const clearConversation = () => {
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to clear the conversation? This will reset all progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            setMessages([]);
            setConversationId(null);
            setFollowUpQuestions([]);
            setIsComplete(false);
            if (onDataUpdate) {
              onDataUpdate({});
            }
          }
        }
      ]
    );
  };

  if (!schema) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No schema provided for chat</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat Assistant</Text>
        <TouchableOpacity onPress={clearConversation} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message.content}
            isUser={message.role === 'user'}
            timestamp={message.timestamp}
          />
        ))}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#007AFF" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}
        
        <FollowUpQuestions
          questions={followUpQuestions}
          onQuestionSelect={handleFollowUpQuestion}
        />
        
        {isComplete && (
          <View style={styles.completeContainer}>
            <Text style={styles.completeText}>✅ Form is complete! You can now submit your data.</Text>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#ff6b6b',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  messageContainer: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  followUpContainer: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  followUpTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  followUpQuestion: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  followUpQuestionText: {
    fontSize: 14,
    color: '#007AFF',
  },
  completeContainer: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#d4edda',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  completeText: {
    fontSize: 16,
    color: '#155724',
    textAlign: 'center',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ChatInterface;