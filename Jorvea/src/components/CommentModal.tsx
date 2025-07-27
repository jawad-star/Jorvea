import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { commentService } from '../services';
import { FirebaseComment } from '../services/firebaseContentService';
import { useAuth } from '../context/AuthContext';

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  contentId: string;
  contentType: 'post' | 'reel';
  contentTitle?: string;
  navigation?: any; // Optional navigation prop
}

export default function CommentModal({
  visible,
  onClose,
  contentId,
  contentType,
  contentTitle,
  navigation
}: CommentModalProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<FirebaseComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (visible && contentId) {
      loadComments();
    }
  }, [visible, contentId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const commentsData = await commentService.getComments(contentId, contentType);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !user) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    try {
      setPosting(true);
      const commentId = await commentService.addComment({
        contentId,
        contentType,
        userId: user.uid,
        username: user.displayName || 'Unknown User',
        userDisplayName: user.displayName || 'Unknown User',
        userAvatar: user.photoURL || undefined,
        text: commentText.trim(),
      });

      // Reload comments to get the latest data from Firebase
      await loadComments();
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await commentService.deleteComment(commentId, user?.uid || '');
            if (success) {
              setComments(prev => prev.filter(comment => comment.id !== commentId));
            } else {
              Alert.alert('Error', 'Failed to delete comment');
            }
          }
        }
      ]
    );
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;
    
    try {
      const isLiked = await commentService.toggleCommentLike(commentId, user.uid);
      // Reload comments to get updated like counts
      loadComments();
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const renderComment = ({ item }: { item: FirebaseComment }) => {
    const isOwnComment = user?.uid === item.userId;
    const isLiked = item.likedBy.includes(user?.uid || '');

    const handleUserPress = () => {
      if (navigation && item.userId !== user?.uid) {
        navigation.navigate('UserProfile', { userId: item.userId });
        onClose(); // Close the modal when navigating
      }
    };

    return (
      <View style={styles.commentItem}>
        <TouchableOpacity onPress={handleUserPress}>
          <Image
            source={{ uri: item.userAvatar || 'https://via.placeholder.com/40' }}
            style={styles.commentAvatar}
          />
        </TouchableOpacity>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <TouchableOpacity onPress={handleUserPress}>
              <Text style={[styles.commentUser, navigation && item.userId !== user?.uid && styles.clickableUser]}>
                {item.userDisplayName || item.username}
              </Text>
            </TouchableOpacity>
            <Text style={styles.commentTime}>{formatTime(item.createdAt)}</Text>
            {isOwnComment && (
              <TouchableOpacity
                onPress={() => handleDeleteComment(item.id)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={16} color="#ff4757" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.commentText}>{item.text}</Text>
          <View style={styles.commentActions}>
            <TouchableOpacity
              onPress={() => handleLikeComment(item.id)}
              style={[styles.commentLike, isLiked && styles.commentLiked]}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={16} 
                color={isLiked ? "#ff4757" : "#666"} 
              />
              {item.likes > 0 && (
                <Text style={[styles.likeCount, isLiked && styles.likeCountActive]}>
                  {item.likes}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        {contentTitle && (
          <View style={styles.contentInfo}>
            <Text style={styles.contentTitle}>{contentTitle}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading comments...</Text>
          </View>
        ) : (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            style={styles.commentsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No comments yet</Text>
                <Text style={styles.emptySubtext}>Be the first to comment!</Text>
              </View>
            }
          />
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <View style={styles.inputRow}>
            <Image
              source={{ uri: user?.photoURL || 'https://via.placeholder.com/40' }}
              style={styles.userAvatar}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Add a comment..."
              placeholderTextColor="#999"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={!commentText.trim() || posting}
              style={[
                styles.sendButton,
                (!commentText.trim() || posting) && styles.sendButtonDisabled
              ]}
            >
              {posting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  placeholder: {
    width: 32,
  },
  contentInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentItem: {
    flexDirection: 'row' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  commentLike: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 4,
  },
  commentLiked: {
    // No additional styles needed, handled by icon color
  },
  likeCount: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  likeCountActive: {
    color: '#ff4757',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#ccc',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  inputRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    padding: 16,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    padding: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: 40,
    height: 40,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  clickableUser: {
    color: '#667eea',
  },
});
