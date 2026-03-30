import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { type ChatState, type Conversation, type Message } from '../../types';

// ─── Thunks ────────────────────────────────────────────────────────────────
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/conversations');
      return res.data.conversations as Conversation[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Failed to load conversations');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ conversationId, page = 1 }: { conversationId: string; page?: number }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/messages/${conversationId}?page=${page}&limit=50`);
      return { conversationId, messages: res.data.messages as Message[] };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Failed to load messages');
    }
  }
);

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (participantId: string, { rejectWithValue }) => {
    try {
      const res = await api.post('/conversations', { participantId });
      return res.data.conversation as Conversation;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Failed to create conversation');
    }
  }
);

export const createGroup = createAsyncThunk(
  "chat/createGroup",
  async ({ name, participants }: { name: string; participants: string[] }) => {
    const res = await api.post("/conversations/group", {
      name,
      participants
    });

    return res.data;
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────
const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: {},
  searchQuery: '',
  isLoadingConversations: false,
  isLoadingMessages: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    // Called when Socket.io emits a new message
    addMessage(state, action: PayloadAction<Message>) {
      const msg = action.payload;
      //get converstion id
      const convId = typeof msg.conversation === 'string' ? msg.conversation : (msg.conversation as any)._id;
      //If no messages for this chat → create array
      if (!state.messages[convId]) state.messages[convId] = [];
      // Avoid duplicates
      const alreadyExists = state.messages[convId].some((m) => m._id === msg._id);
      if (!alreadyExists) state.messages[convId].push(msg);
      // Update last message in conversation list
      const conv = state.conversations.find((c) => c._id === convId);
      if (conv) conv.lastMessage = msg;
    },
    updateConversation(state, action: PayloadAction<Conversation>) {
      const idx = state.conversations.findIndex((c) => c._id === action.payload._id);
      if (idx > -1) { //index[0, 1, 2, ...]
        state.conversations[idx] = action.payload; // exists -> update
      } else {
        state.conversations.unshift(action.payload); //not exists -> add
      }
      // Re-sort by updatedAt
      state.conversations.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    },
    setTyping(state, action: PayloadAction<{ conversationId: string; userId: string; userName: string; isTyping: boolean }>) {
      const { conversationId, userId, userName, isTyping } = action.payload;
      //if no typingusers create empty object
      if (!state.typingUsers[conversationId]) state.typingUsers[conversationId] = {};

      if (isTyping) {
        state.typingUsers[conversationId][userId] = userName; //store the username
      } else {
        delete state.typingUsers[conversationId][userId]; //delete the username
      }
    },
    updateMessageStatus(state, action: PayloadAction<{ conversationId: string; readBy: string; currentUserId: string }>) {
      const { conversationId, currentUserId } = action.payload;
      const messages = state.messages[conversationId];
      if (messages) {
        messages.forEach((msg) => {
          const senderId = typeof msg.sender === 'string' ? msg.sender : (msg.sender as any)._id;
          if (senderId === currentUserId) msg.status = 'read';
        });
      }
    },
    removeMessage(state, action: PayloadAction<{ conversationId: string; messageId: string }>) {
      const { conversationId, messageId } = action.payload;
      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].filter(
          (m) => m._id !== messageId
        );
      }
    },
    updateUserOnlineInConversations(state, action: PayloadAction<{ userId: string; isOnline: boolean; lastSeen?: string }>) {
      state.conversations.forEach((conv) => {
        conv.participants.forEach((p) => {
          if (p._id === action.payload.userId) {
            p.isOnline = action.payload.isOnline;
            if (action.payload.lastSeen) p.lastSeen = action.payload.lastSeen;
          }
        });
      });
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchConversations.pending, (state) => { state.isLoadingConversations = true; });
    builder.addCase(fetchConversations.fulfilled, (state, action) => {
      state.isLoadingConversations = false;
      state.conversations = action.payload;
    });
    builder.addCase(fetchConversations.rejected, (state) => { state.isLoadingConversations = false; });

    builder.addCase(fetchMessages.pending, (state) => { state.isLoadingMessages = true; });
    builder.addCase(fetchMessages.fulfilled, (state, action) => {
      state.isLoadingMessages = false;
      state.messages[action.payload.conversationId] = action.payload.messages;
    });
    builder.addCase(fetchMessages.rejected, (state) => { state.isLoadingMessages = false; });

    builder.addCase(createConversation.fulfilled, (state, action) => {
      const exists = state.conversations.find((c) => c._id === action.payload._id);
      if (!exists) state.conversations.unshift(action.payload);
      state.activeConversationId = action.payload._id;
    });
  },
});

export const {
  setActiveConversation,
  setSearchQuery,
  addMessage,
  updateConversation,
  setTyping,
  updateMessageStatus,
  removeMessage,
  updateUserOnlineInConversations,
} = chatSlice.actions;
export default chatSlice.reducer;
