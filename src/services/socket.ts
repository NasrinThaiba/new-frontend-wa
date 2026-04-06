import { io, Socket } from 'socket.io-client';
import { store } from '../store/store';

let socket: Socket | null = null;

export const initSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io('http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling'], //Transports = methods used to communicate between client and server, websocket is first, if not supported, fallback to polling
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.removeAllListeners();

  socket.on('connect', () => console.log('✅ Socket connected:', socket?.id));

  const state = store.getState();
    const conversations = state.chat.conversations;

    conversations.forEach((conv: any) => {
      socket?.emit('conversation:join', conv._id);
    });

    console.log('✅ Rejoined all conversations');

  socket.on('disconnect', (reason) => console.log('❌ Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinConversation = (conversationId: string): void => {
  socket?.emit('conversation:join', conversationId);
};

export const leaveConversation = (conversationId: string): void => {
  socket?.emit('conversation:leave', conversationId);
};

export const emitTypingStart = (conversationId: string): void => {
  socket?.emit('typing:start', { conversationId });
};

export const emitTypingStop = (conversationId: string): void => {
  socket?.emit('typing:stop', { conversationId });
};

export const emitMessageRead = (conversationId: string): void => {
  socket?.emit('message:read', { conversationId });
};
