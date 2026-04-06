export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  status: string;
  phone: string;
  isOnline: boolean;
  lastSeen?: string;
  blockedUsers?: string[];
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User | string;
  text?: string;
  status: MessageStatus;
  reactions: Array<{ userId: string; emoji: string }>;
  replyTo?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: User[];
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  groupAdmin?: string;
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
  hasUnread? : boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  allUsers: User[];
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, Record<string, string>>;
  searchQuery: string;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
}

export interface UIState {
  showContactInfo: boolean;
  showNewChat: boolean;
  showSettings: boolean;
  showCreateGroup: boolean;
}

// Socket event types
export interface TypingEvent {
  userId: string;
  userName: string;
  conversationId: string;
}

export interface UserOnlineEvent {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface MessageStatusEvent {
  messageId: string;
  status: MessageStatus;
}

export interface MessageReadEvent {
  conversationId: string;
  readBy: string;
}

export interface UserState {
  blockedUsers: any[];
  loading: boolean;
}

export interface AddParticipantsModalProps {
  onClose: () => void;
  groupId: string;
  participants: User[] ;
}

export interface IconProps {
  className?: string;
  size?: number | string;
  color?: string;
}