export interface Settings {
  openRouterApiKey: string;
  openRouterModel: string;
  customModel: string;
  zenrioApiKey: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    action?: string;
    status?: 'pending' | 'completed' | 'failed';
    platform?: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  platform?: string;
}

export interface SocialAccount {
  id: string;
  platform: 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'tiktok' | 'youtube';
  username: string;
  profileName: string;
  avatarUrl?: string;
  connected: boolean;
  followers?: number;
  following?: number;
  posts?: number;
}

export interface User {
  email: string;
  name: string;
  avatar?: string;
}