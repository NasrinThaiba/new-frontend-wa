import { useEffect } from 'react';
import { initSocket, disconnectSocket } from '../services/socket';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  addMessage,
  updateConversation,
  setTyping,
  updateMessageStatus,
  updateUserOnlineInConversations,
} from '../store/slices/chatSlice';
import { updateUserOnlineStatus } from '../store/slices/authSlice';
import { type Message, type Conversation, type TypingEvent, type UserOnlineEvent, type MessageReadEvent } from '../types';

export const useSocket = (): void => {
  const dispatch = useAppDispatch();
  const { token, isAuthenticated, user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = initSocket(token);

    // Handlers
    const handleMessage = (message: Message) => {
      dispatch(addMessage(message));
    };

    const handleConversationUpdate = (conversation: Conversation) => {
      dispatch(updateConversation(conversation));
    };

    const handleTypingStart = (event: TypingEvent) => {
      dispatch(setTyping({ ...event, isTyping: true }));
    };

    const handleTypingStop = (event: Omit<TypingEvent, 'userName'>) => {
      dispatch(setTyping({ ...event, userName: '', isTyping: false }));
    };

    const handleMessageRead = (event: MessageReadEvent) => {
      if (user) {
        dispatch(updateMessageStatus({ ...event, currentUserId: user._id }));
      }
    };

    const handleUserOnline = (event: UserOnlineEvent) => {
      dispatch(updateUserOnlineStatus(event));
      dispatch(updateUserOnlineInConversations(event));
    };

    // Register
    socket.on('message:new', handleMessage);
    socket.on('conversation:updated', handleConversationUpdate);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('message:read', handleMessageRead);
    socket.on('user:online', handleUserOnline);

    // Cleanup
    return () => {
      socket.off('message:new', handleMessage);
      socket.off('conversation:updated', handleConversationUpdate);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('message:read', handleMessageRead);
      socket.off('user:online', handleUserOnline);
    };

  }, [isAuthenticated, token]); // removed user & dispatch

  // Disconnect on logout
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
    }
  }, [isAuthenticated]);
};