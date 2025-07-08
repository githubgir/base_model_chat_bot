/**
 * Dynamic Form Component
 * 
 * This component dynamically generates form fields based on a Pydantic schema.
 * It handles different field types including strings, numbers, booleans, enums,
 * and nested objects.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

/**
 * Individual field component that renders based on field type
 */
const FormField = ({ field, value, onChange, errors = {} }) => {
  const hasError = errors[field.name];
  
  const renderField = () => {
    switch (field.type) {
      case 'string':
        if (field.options) {
          // Enum/Literal field - render as picker
          return (
            <View style={[styles.fieldContainer, hasError && styles.errorContainer]}>
              <Text style={styles.fieldLabel}>
                {field.name} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={value || ''}
                  onValueChange={(itemValue) => onChange(field.name, itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select an option..." value="" />
                  {field.options.map((option, index) => (
                    <Picker.Item key={index} label={option} value={option} />
                  ))}
                </Picker>
              </View>
              {field.description && <Text style={styles.fieldDescription}>{field.description}</Text>}
              {hasError && <Text style={styles.errorText}>{errors[field.name]}</Text>}
            </View>
          );
        } else {
          // Regular string field
          return (
            <View style={[styles.fieldContainer, hasError && styles.errorContainer]}>
              <Text style={styles.fieldLabel}>
                {field.name} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
              <TextInput
                style={[styles.textInput, hasError && styles.errorInput]}
                value={value || ''}
                onChangeText={(text) => onChange(field.name, text)}
                placeholder={field.description || `Enter ${field.name}`}
                multiline={field.name.includes('description') || field.name.includes('comment')}
                numberOfLines={field.name.includes('description') || field.name.includes('comment') ? 3 : 1}
              />
              {field.description && <Text style={styles.fieldDescription}>{field.description}</Text>}
              {hasError && <Text style={styles.errorText}>{errors[field.name]}</Text>}
            </View>
          );
        }
        
      case 'integer':
      case 'number':
        return (
          <View style={[styles.fieldContainer, hasError && styles.errorContainer]}>
            <Text style={styles.fieldLabel}>
              {field.name} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={[styles.textInput, hasError && styles.errorInput]}
              value={value?.toString() || ''}
              onChangeText={(text) => {
                const numValue = field.type === 'integer' ? parseInt(text) : parseFloat(text);
                onChange(field.name, isNaN(numValue) ? null : numValue);
              }}
              placeholder={field.description || `Enter ${field.name}`}
              keyboardType="numeric"
            />
            {field.description && <Text style={styles.fieldDescription}>{field.description}</Text>}
            {hasError && <Text style={styles.errorText}>{errors[field.name]}</Text>}
          </View>
        );
        
      case 'boolean':
        return (
          <View style={[styles.fieldContainer, hasError && styles.errorContainer]}>
            <View style={styles.switchContainer}>
              <Text style={styles.fieldLabel}>
                {field.name} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
              <Switch
                value={value || false}
                onValueChange={(switchValue) => onChange(field.name, switchValue)}
              />
            </View>
            {field.description && <Text style={styles.fieldDescription}>{field.description}</Text>}
            {hasError && <Text style={styles.errorText}>{errors[field.name]}</Text>}
          </View>
        );
        
      case 'object':
        // Nested object - render as expandable section
        return (
          <View style={[styles.fieldContainer, styles.nestedContainer, hasError && styles.errorContainer]}>
            <Text style={styles.fieldLabel}>
              {field.name} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            {field.description && <Text style={styles.fieldDescription}>{field.description}</Text>}
            <View style={styles.nestedFields}>
              {field.nested_schema && field.nested_schema.fields?.map((nestedField, index) => (
                <FormField
                  key={index}
                  field={nestedField}
                  value={value?.[nestedField.name]}
                  onChange={(fieldName, fieldValue) => {
                    const newValue = { ...value, [fieldName]: fieldValue };
                    onChange(field.name, newValue);
                  }}
                  errors={errors[field.name] || {}}
                />
              ))}
            </View>
            {hasError && <Text style={styles.errorText}>{errors[field.name]}</Text>}
          </View>
        );
        
      default:
        return (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Unsupported field type: {field.type}</Text>
          </View>
        );
    }
  };
  
  return renderField();
};

/**
 * Main DynamicForm component
 */
const DynamicForm = ({ 
  schema, 
  onDataChange, 
  onSubmit, 
  loading = false,
  errors = {},
  initialData = {} 
}) => {
  const [formData, setFormData] = useState(initialData);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear validation error when field is updated
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    schema.fields?.forEach(field => {
      if (field.required && (!formData[field.name] || formData[field.name] === '')) {
        errors[field.name] = `${field.name} is required`;
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      if (onSubmit) {
        onSubmit(formData);
      }
    } else {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
    }
  };

  if (!schema || !schema.fields) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No schema provided</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        {schema.title && <Text style={styles.formTitle}>{schema.title}</Text>}
        {schema.description && <Text style={styles.formDescription}>{schema.description}</Text>}
        
        {schema.fields.map((field, index) => (
          <FormField
            key={index}
            field={field}
            value={formData[field.name]}
            onChange={handleFieldChange}
            errors={{ ...validationErrors, ...errors }}
          />
        ))}
        
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  formDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorContainer: {
    borderColor: '#ff6b6b',
    borderWidth: 1,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  required: {
    color: '#ff6b6b',
  },
  fieldDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  errorInput: {
    borderColor: '#ff6b6b',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  nestedContainer: {
    backgroundColor: '#f9f9f9',
  },
  nestedFields: {
    marginTop: 10,
    paddingLeft: 10,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
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
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 5,
  },
});

export default DynamicForm;