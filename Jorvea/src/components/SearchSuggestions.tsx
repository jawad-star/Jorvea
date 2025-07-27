import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchSuggestion {
  id: string;
  type: 'user' | 'hashtag' | 'location';
  title: string;
  subtitle?: string;
  image?: string;
  verified?: boolean;
}

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  onSuggestionPress?: (suggestion: SearchSuggestion) => void;
  onClearHistory?: () => void;
}

export default function SearchSuggestions({ 
  suggestions, 
  onSuggestionPress,
  onClearHistory 
}: SearchSuggestionsProps) {

  const getIcon = (type: string) => {
    switch (type) {
      case 'user':
        return 'person-outline';
      case 'hashtag':
        return 'pricetag-outline';
      case 'location':
        return 'location-outline';
      default:
        return 'search-outline';
    }
  };

  const renderSuggestion = (suggestion: SearchSuggestion) => (
    <TouchableOpacity 
      key={suggestion.id}
      style={styles.suggestionItem}
      onPress={() => onSuggestionPress?.(suggestion)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionLeft}>
        {suggestion.image ? (
          <Image source={{ uri: suggestion.image }} style={styles.suggestionImage} />
        ) : (
          <View style={styles.suggestionIcon}>
            <Ionicons name={getIcon(suggestion.type) as any} size={20} color="#666" />
          </View>
        )}
        
        <View style={styles.suggestionText}>
          <View style={styles.titleRow}>
            <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
            {suggestion.verified && (
              <Ionicons name="checkmark-circle" size={14} color="#1DA1F2" />
            )}
          </View>
          {suggestion.subtitle && (
            <Text style={styles.suggestionSubtitle}>{suggestion.subtitle}</Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity style={styles.suggestionAction}>
        <Ionicons name="arrow-up-outline" size={16} color="#666" style={{ transform: [{ rotate: '45deg' }] }} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recent Searches</Text>
        <TouchableOpacity onPress={onClearHistory}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {suggestions.map(renderSuggestion)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    maxHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clearText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f5f5f5',
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  suggestionImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  suggestionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  suggestionAction: {
    padding: 8,
  },
});
