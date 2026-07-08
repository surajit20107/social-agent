import type { Settings, Conversation, SocialAccount, User } from '../types';

const KEYS = {
  SETTINGS: 'socialflow_settings',
  CONVERSATIONS: 'socialflow_conversations',
  ACCOUNTS: 'socialflow_accounts',
  USER: 'socialflow_user',
  ONBOARDED: 'socialflow_onboarded',
} as const;

export function getSettings(): Settings | null {
  try {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export function getConversations(): Conversation[] {
  try {
    const data = localStorage.getItem(KEYS.CONVERSATIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  localStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(conversations));
}

export function getConversation(id: string): Conversation | undefined {
  return getConversations().find(c => c.id === id);
}

export function saveConversation(conversation: Conversation): void {
  const conversations = getConversations();
  const index = conversations.findIndex(c => c.id === conversation.id);
  if (index >= 0) {
    conversations[index] = conversation;
  } else {
    conversations.push(conversation);
  }
  saveConversations(conversations);
}

export function deleteConversation(id: string): void {
  const conversations = getConversations().filter(c => c.id !== id);
  saveConversations(conversations);
}

export function getAccounts(): SocialAccount[] {
  try {
    const data = localStorage.getItem(KEYS.ACCOUNTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: SocialAccount[]): void {
  localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
}

export function getUser(): User | null {
  try {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveUser(user: User): void {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export function isOnboarded(): boolean {
  return localStorage.getItem(KEYS.ONBOARDED) === 'true';
}

export function setOnboarded(): void {
  localStorage.setItem(KEYS.ONBOARDED, 'true');
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    instagram: '#E4405F',
    twitter: '#1DA1F2',
    linkedin: '#0A66C2',
    facebook: '#1877F2',
    tiktok: '#000000',
    youtube: '#FF0000',
    threads: '#000000',
    bluesky: '#0285FF',
    pinterest: '#E60023',
    reddit: '#FF4500',
    snapchat: '#FFFC00',
    telegram: '#0088CC',
    googlebusiness: '#4285F4',
    whatsapp: '#25D366',
  };
  return colors[platform.toLowerCase()] || '#a1a1aa';
}

export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    instagram: 'instagram',
    twitter: 'twitter',
    linkedin: 'linkedin',
    facebook: 'facebook',
    tiktok: 'music',
    youtube: 'youtube',
    threads: 'messagesquare',
    bluesky: 'cloud',
    pinterest: 'mappin',
    reddit: 'messagecircle',
    snapchat: 'ghost',
    telegram: 'send',
    googlebusiness: 'store',
    whatsapp: 'phone',
  };
  return icons[platform.toLowerCase()] || 'globe';
}