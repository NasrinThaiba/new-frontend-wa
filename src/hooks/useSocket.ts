import { useEffect } from 'react';
import { initSocket, disconnectSocket } from '../services/socket';
import { useAppDispatch, useAppSelector } from '../store/store';
import { addMessage, updateConversation, setTyping,
  updateMessageStatus,
  updateUserOnlineInConversations,
} from '../store/slices/chatSlice';
import { updateUserOnlineStatus } from '../store/slices/authSlice';
import { type Message, type Conversation, type TypingEvent, type UserOnlineEvent } from '../types';

export const useSocket = (): void => {
  const dispatch = useAppDispatch();
  const { token, isAuthenticated } = useAppSelector((s) => s.auth);
  const conversations = useAppSelector((s) => s.chat.conversations);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = initSocket(token);

    conversations.forEach((conv) => { socket.emit('conversation:join', conv._id)});

    // Handlers
    const handleMessage = (message: Message) => {
      dispatch(addMessage(message));
      dispatch( updateConversation({ _id: message.conversation, hasUnread: true }));
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

    const handleMessageStatusUpdate = (event: any) => {
      dispatch(updateMessageStatus(event));
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
    socket.on('user:online', handleUserOnline);
    socket.on('message:status:update', handleMessageStatusUpdate);

    // Cleanup
    return () => {
      socket.off('message:new', handleMessage);
      socket.off('conversation:updated', handleConversationUpdate);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('user:online', handleUserOnline);
      socket.off('message:status:update', handleMessageStatusUpdate);
    };

  }, [isAuthenticated, token]); // removed user & dispatch

  // Disconnect on logout
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
    }
  }, [isAuthenticated]);
};