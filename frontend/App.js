/**
 * Main App Component
 * 
 * This is the main application component that brings together all the pieces:
 * schema parsing, dynamic form generation, chat interface, and results display.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Import theming system
import theme from './styles/theme';
import globalStyles from './styles/globalStyles';
import { useResponsive, useResponsiveStyles } from './hooks/useResponsive';

// Import our custom components
import DynamicForm from './components/DynamicForm';
import ChatInterface from './components/ChatInterface';
import ResultsDisplay from './components/ResultsDisplay';
import ApiService from './services/api';

// Sample Pydantic model definitions for testing
const SAMPLE_MODELS = {
  'User Profile': `
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"

class UserProfile(BaseModel):
    name: str = Field(..., description="Full name of the user")
    email: str = Field(..., description="Email address")
    age: int = Field(..., ge=18, le=120, description="Age in years")
    role: UserRole = Field(UserRole.USER, description="User role in the system")
    is_active: bool = Field(True, description="Whether the user account is active")
    bio: Optional[str] = Field(None, description="Optional user biography")
  `,
  'Product Order': `
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"

class OrderItem(BaseModel):
    product_name: str = Field(..., description="Name of the product")
    quantity: int = Field(..., ge=1, description="Quantity ordered")
    price: float = Field(..., ge=0, description="Price per unit")

class ProductOrder(BaseModel):
    customer_name: str = Field(..., description="Customer's full name")
    customer_email: str = Field(..., description="Customer's email address")
    items: List[OrderItem] = Field(..., description="List of ordered items")
    status: OrderStatus = Field(OrderStatus.PENDING, description="Current order status")
    notes: Optional[str] = Field(None, description="Additional order notes")
  `
};

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [schema, setSchema] = useState(null);
  const [formData, setFormData] = useState({});
  const [apiResults, setApiResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [customModel, setCustomModel] = useState('');
  const [modelName, setModelName] = useState('');
  
  // Responsive hooks
  const { isTablet, isDesktop } = useResponsive();
  const responsiveStyles = useResponsiveStyles();

  // Load a sample model on app start
  useEffect(() => {
    loadSampleModel('User Profile');
  }, []);

  const loadSampleModel = async (modelKey) => {
    try {
      setLoading(true);
      const modelDefinition = SAMPLE_MODELS[modelKey];
      const response = await ApiService.parseSchema(modelDefinition, modelKey);
      setSchema(response.schema_data);
      setFormData({});
      setApiResults(null);
      setCurrentView('form');
    } catch (error) {
      Alert.alert('Error', `Failed to load model: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomModel = async () => {
    if (!customModel.trim() || !modelName.trim()) {
      Alert.alert('Error', 'Please provide both model definition and name');
      return;
    }

    try {
      setLoading(true);
      const response = await ApiService.parseSchema(customModel, modelName);
      setSchema(response.schema_data);
      setFormData({});
      setApiResults(null);
      setCurrentView('form');
      setModalVisible(false);
      setCustomModel('');
      setModelName('');
    } catch (error) {
      Alert.alert('Error', `Failed to parse custom model: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      setLoading(true);
      // For demo purposes, we'll forward to httpbin.org which echoes the request
      const response = await ApiService.forwardToExternalApi(
        'https://httpbin.org/post',
        'POST',
        data
      );
      setApiResults(response);
      setCurrentView('results');
    } catch (error) {
      Alert.alert('Error', `Failed to submit form: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChatComplete = (completedData) => {
    setFormData(completedData);
    Alert.alert(
      'Form Complete',
      'The chat assistant has completed filling out the form. You can review and submit it.',
      [{ text: 'OK', onPress: () => setCurrentView('form') }]
    );
  };

  const renderHomeView = () => (
    <ScrollView style={[globalStyles.container, responsiveStyles.getStyle({
      mobile: { paddingHorizontal: responsiveStyles.spacing.sm },
      tablet: { paddingHorizontal: responsiveStyles.spacing.lg },
      desktop: { paddingHorizontal: responsiveStyles.spacing.xl }
    })]}>
      <View style={[styles.header, responsiveStyles.getStyle({
        mobile: { paddingVertical: responsiveStyles.spacing.lg },
        tablet: { paddingVertical: responsiveStyles.spacing.xl },
        desktop: { paddingVertical: responsiveStyles.spacing['2xl'] }
      })]}>
        <Text style={[globalStyles.textHeading1, styles.title]}>Chat Bot Form Generator</Text>
        <Text style={[globalStyles.textBody, styles.subtitle]}>
          Generate dynamic forms from Pydantic models and fill them using natural language
        </Text>
      </View>

      <View style={[globalStyles.card, responsiveStyles.getStyle({
        tablet: { marginHorizontal: responsiveStyles.spacing.lg },
        desktop: { marginHorizontal: responsiveStyles.spacing.xl }
      })]}>
        <Text style={[globalStyles.textHeading3, globalStyles.marginBottomMd]}>Sample Models</Text>
        {Object.keys(SAMPLE_MODELS).map((modelKey) => (
          <TouchableOpacity
            key={modelKey}
            style={[globalStyles.button, globalStyles.buttonPrimary, globalStyles.marginBottomSm]}
            onPress={() => loadSampleModel(modelKey)}
          >
            <Text style={globalStyles.buttonText}>{modelKey}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[globalStyles.card, responsiveStyles.getStyle({
        tablet: { marginHorizontal: responsiveStyles.spacing.lg },
        desktop: { marginHorizontal: responsiveStyles.spacing.xl }
      })]}>
        <Text style={[globalStyles.textHeading3, globalStyles.marginBottomMd]}>Custom Model</Text>
        <TouchableOpacity
          style={[globalStyles.button, globalStyles.buttonSecondary]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={globalStyles.buttonTextSecondary}>Load Custom Pydantic Model</Text>
        </TouchableOpacity>
      </View>

      <View style={[globalStyles.card, responsiveStyles.getStyle({
        tablet: { marginHorizontal: responsiveStyles.spacing.lg },
        desktop: { marginHorizontal: responsiveStyles.spacing.xl }
      })]}>
        <Text style={[globalStyles.textHeading3, globalStyles.marginBottomMd]}>Features</Text>
        <View style={styles.featureList}>
          <Text style={[globalStyles.textBody, styles.featureItem]}>• Dynamic form generation from Pydantic schemas</Text>
          <Text style={[globalStyles.textBody, styles.featureItem]}>• Natural language form filling with AI</Text>
          <Text style={[globalStyles.textBody, styles.featureItem]}>• Support for nested models and enums</Text>
          <Text style={[globalStyles.textBody, styles.featureItem]}>• External API integration</Text>
          <Text style={[globalStyles.textBody, styles.featureItem]}>• Real-time validation and error handling</Text>
          <Text style={[globalStyles.textBody, styles.featureItem]}>• Voice-to-voice conversation support</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderNavigationBar = () => (
    <View style={[styles.navbar, responsiveStyles.getStyle({
      mobile: { paddingVertical: responsiveStyles.spacing.sm },
      tablet: { paddingVertical: responsiveStyles.spacing.md },
      desktop: { paddingVertical: responsiveStyles.spacing.lg }
    })]}>
      <TouchableOpacity
        style={[styles.navButton, currentView === 'home' && styles.activeNavButton]}
        onPress={() => setCurrentView('home')}
      >
        <Text style={[styles.navButtonText, currentView === 'home' && styles.activeNavButtonText]}>
          Home
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.navButton, currentView === 'form' && styles.activeNavButton, !schema && styles.navButtonDisabled]}
        onPress={() => setCurrentView('form')}
        disabled={!schema}
      >
        <Text style={[styles.navButtonText, currentView === 'form' && styles.activeNavButtonText, !schema && styles.navButtonTextDisabled]}>
          Form
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.navButton, currentView === 'chat' && styles.activeNavButton, !schema && styles.navButtonDisabled]}
        onPress={() => setCurrentView('chat')}
        disabled={!schema}
      >
        <Text style={[styles.navButtonText, currentView === 'chat' && styles.activeNavButtonText, !schema && styles.navButtonTextDisabled]}>
          Chat
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.navButton, currentView === 'results' && styles.activeNavButton, !apiResults && styles.navButtonDisabled]}
        onPress={() => setCurrentView('results')}
        disabled={!apiResults}
      >
        <Text style={[styles.navButtonText, currentView === 'results' && styles.activeNavButtonText, !apiResults && styles.navButtonTextDisabled]}>
          Results
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCustomModelModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Load Custom Pydantic Model</Text>
          
          <Text style={styles.modalLabel}>Model Name:</Text>
          <TextInput
            style={styles.modalInput}
            value={modelName}
            onChangeText={setModelName}
            placeholder="Enter model name (e.g., 'MyModel')"
          />
          
          <Text style={styles.modalLabel}>Model Definition:</Text>
          <TextInput
            style={[styles.modalInput, styles.modalTextArea]}
            value={customModel}
            onChangeText={setCustomModel}
            placeholder="Paste your Pydantic BaseModel definition here..."
            multiline
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.loadButton]}
              onPress={loadCustomModel}
            >
              <Text style={styles.loadButtonText}>Load Model</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {currentView === 'home' && renderHomeView()}
      
      {currentView === 'form' && schema && (
        <DynamicForm
          schema={schema}
          onDataChange={setFormData}
          onSubmit={handleFormSubmit}
          loading={loading}
          initialData={formData}
        />
      )}
      
      {currentView === 'chat' && schema && (
        <ChatInterface
          schema={schema}
          currentData={formData}
          onDataUpdate={setFormData}
          onComplete={handleChatComplete}
        />
      )}
      
      {currentView === 'results' && apiResults && (
        <ResultsDisplay
          results={apiResults}
          loading={loading}
          onRetry={() => handleFormSubmit(formData)}
        />
      )}

      {renderNavigationBar()}
      {renderCustomModelModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  section: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  modelButton: {
    padding: 15,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  modelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  customButton: {
    padding: 15,
    backgroundColor: '#28a745',
    borderRadius: 8,
    alignItems: 'center',
  },
  customButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  featureList: {
    marginTop: 10,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 10,
  },
  navButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeNavButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  navButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeNavButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  modalTextArea: {
    height: 200,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  loadButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});