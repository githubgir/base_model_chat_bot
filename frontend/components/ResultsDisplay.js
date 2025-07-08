/**
 * Results Display Component
 * 
 * This component displays the results from external API calls in a formatted
 * and user-friendly way. It handles different types of response data including
 * JSON objects, arrays, and plain text.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Clipboard,
  ActivityIndicator
} from 'react-native';

/**
 * Component to display JSON data in a formatted way
 */
const JsonDisplay = ({ data, depth = 0 }) => {
  const [collapsed, setCollapsed] = useState(depth > 2);
  
  const renderValue = (value, key = null) => {
    if (value === null || value === undefined) {
      return <Text style={styles.nullValue}>null</Text>;
    }
    
    if (typeof value === 'boolean') {
      return <Text style={styles.booleanValue}>{value.toString()}</Text>;
    }
    
    if (typeof value === 'number') {
      return <Text style={styles.numberValue}>{value}</Text>;
    }
    
    if (typeof value === 'string') {
      return <Text style={styles.stringValue}>"{value}"</Text>;
    }
    
    if (Array.isArray(value)) {
      return (
        <View style={styles.arrayContainer}>
          <TouchableOpacity onPress={() => setCollapsed(!collapsed)}>
            <Text style={styles.arrayHeader}>
              [{collapsed ? `${value.length} items` : ''}
              {collapsed ? ' ...' : ''}
            </Text>
          </TouchableOpacity>
          {!collapsed && (
            <View style={styles.arrayContent}>
              {value.map((item, index) => (
                <View key={index} style={styles.arrayItem}>
                  <Text style={styles.arrayIndex}>{index}:</Text>
                  <JsonDisplay data={item} depth={depth + 1} />
                </View>
              ))}
            </View>
          )}
          {!collapsed && <Text style={styles.arrayFooter}>]</Text>}
        </View>
      );
    }
    
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      return (
        <View style={styles.objectContainer}>
          <TouchableOpacity onPress={() => setCollapsed(!collapsed)}>
            <Text style={styles.objectHeader}>
              {'{'}
              {collapsed ? ` ${keys.length} properties` : ''}
              {collapsed ? ' ...' : ''}
            </Text>
          </TouchableOpacity>
          {!collapsed && (
            <View style={styles.objectContent}>
              {keys.map((objKey, index) => (
                <View key={index} style={styles.objectItem}>
                  <Text style={styles.objectKey}>"{objKey}":</Text>
                  <JsonDisplay data={value[objKey]} depth={depth + 1} />
                </View>
              ))}
            </View>
          )}
          {!collapsed && <Text style={styles.objectFooter}>{'}'}</Text>}
        </View>
      );
    }
    
    return <Text style={styles.unknownValue}>{String(value)}</Text>;
  };
  
  return renderValue(data);
};

/**
 * Component to display response headers
 */
const HeadersDisplay = ({ headers }) => {
  if (!headers || Object.keys(headers).length === 0) {
    return null;
  }
  
  return (
    <View style={styles.headersContainer}>
      <Text style={styles.sectionTitle}>Response Headers</Text>
      <View style={styles.headersContent}>
        {Object.entries(headers).map(([key, value], index) => (
          <View key={index} style={styles.headerItem}>
            <Text style={styles.headerKey}>{key}:</Text>
            <Text style={styles.headerValue}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * Component to display execution metrics
 */
const MetricsDisplay = ({ statusCode, executionTime, success }) => {
  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return '#28a745';
    if (status >= 300 && status < 400) return '#ffc107';
    if (status >= 400 && status < 500) return '#fd7e14';
    if (status >= 500) return '#dc3545';
    return '#6c757d';
  };
  
  return (
    <View style={styles.metricsContainer}>
      <View style={styles.metricItem}>
        <Text style={styles.metricLabel}>Status:</Text>
        <Text style={[styles.metricValue, { color: getStatusColor(statusCode) }]}>
          {statusCode} {success ? '✅' : '❌'}
        </Text>
      </View>
      <View style={styles.metricItem}>
        <Text style={styles.metricLabel}>Time:</Text>
        <Text style={styles.metricValue}>{executionTime?.toFixed(2)}s</Text>
      </View>
    </View>
  );
};

/**
 * Main ResultsDisplay component
 */
const ResultsDisplay = ({ 
  results, 
  loading = false, 
  error = null,
  onRetry = null,
  title = "API Results"
}) => {
  const [selectedTab, setSelectedTab] = useState('data');
  
  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'Results copied to clipboard');
  };
  
  const handleCopyResults = () => {
    if (results) {
      const textToCopy = JSON.stringify(results, null, 2);
      copyToClipboard(textToCopy);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Processing request...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
  
  if (!results) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No results to display</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyResults}>
          <Text style={styles.copyButtonText}>Copy</Text>
        </TouchableOpacity>
      </View>
      
      <MetricsDisplay
        statusCode={results.status_code}
        executionTime={results.execution_time}
        success={results.success}
      />
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'data' && styles.activeTab]}
          onPress={() => setSelectedTab('data')}
        >
          <Text style={[styles.tabText, selectedTab === 'data' && styles.activeTabText]}>
            Data
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'headers' && styles.activeTab]}
          onPress={() => setSelectedTab('headers')}
        >
          <Text style={[styles.tabText, selectedTab === 'headers' && styles.activeTabText]}>
            Headers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'raw' && styles.activeTab]}
          onPress={() => setSelectedTab('raw')}
        >
          <Text style={[styles.tabText, selectedTab === 'raw' && styles.activeTabText]}>
            Raw
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'data' && (
          <View style={styles.dataContainer}>
            {results.response_data ? (
              <JsonDisplay data={results.response_data} />
            ) : (
              <Text style={styles.noDataText}>No response data</Text>
            )}
          </View>
        )}
        
        {selectedTab === 'headers' && (
          <HeadersDisplay headers={results.response_headers} />
        )}
        
        {selectedTab === 'raw' && (
          <View style={styles.rawContainer}>
            <Text style={styles.rawText}>
              {JSON.stringify(results, null, 2)}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  copyButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  dataContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
  },
  // JSON Display Styles
  nullValue: {
    color: '#999',
    fontStyle: 'italic',
  },
  booleanValue: {
    color: '#0066cc',
    fontWeight: '600',
  },
  numberValue: {
    color: '#009900',
    fontWeight: '600',
  },
  stringValue: {
    color: '#cc0000',
  },
  arrayContainer: {
    marginLeft: 10,
  },
  arrayHeader: {
    color: '#666',
    fontWeight: '600',
  },
  arrayContent: {
    marginLeft: 15,
  },
  arrayItem: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  arrayIndex: {
    color: '#666',
    marginRight: 5,
    minWidth: 20,
  },
  arrayFooter: {
    color: '#666',
  },
  objectContainer: {
    marginLeft: 10,
  },
  objectHeader: {
    color: '#666',
    fontWeight: '600',
  },
  objectContent: {
    marginLeft: 15,
  },
  objectItem: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  objectKey: {
    color: '#0066cc',
    marginRight: 5,
    fontWeight: '600',
  },
  objectFooter: {
    color: '#666',
  },
  unknownValue: {
    color: '#666',
    fontStyle: 'italic',
  },
  // Headers Display Styles
  headersContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  headersContent: {
    marginLeft: 10,
  },
  headerItem: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  headerKey: {
    color: '#0066cc',
    marginRight: 5,
    fontWeight: '600',
    minWidth: 120,
  },
  headerValue: {
    color: '#333',
    flex: 1,
  },
  // Raw Display Styles
  rawContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  rawText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
  },
  // State Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#dc3545',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
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
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ResultsDisplay;