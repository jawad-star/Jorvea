export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  caption: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string; // For videos
  playbackId?: string; // Mux playback ID for videos
  assetId?: string; // Mux asset ID for videos
  likes: number;
  comments: number;
  shares: number;
  createdAt: Date;
  updatedAt: Date;
  isPrivate: boolean;
  tags?: string[];
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
}

export interface Reel {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  playbackId: string; // Mux playback ID
  assetId: string; // Mux asset ID
  duration: number; // Video duration in seconds
  likes: number;
  comments: number;
  shares: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  music?: {
    name: string;
    artist: string;
    url: string;
  };
}

export interface CreatePostData {
  caption: string;
  mediaType: 'image' | 'video';
  mediaFile: {
    uri: string;
    type: string;
    size: number;
    duration?: number;
  };
  isPrivate?: boolean;
  tags?: string[];
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
}

export interface CreateReelData {
  title: string;
  description: string;
  videoFile: {
    uri: string;
    type: string;
    size: number;
    duration: number;
  };
  tags?: string[];
  music?: {
    name: string;
    artist: string;
    url: string;
  };
}

export interface UploadProgress {
  stage: 'uploading' | 'processing' | 'complete' | 'error';
  percentage: number;
  message: string;
}
