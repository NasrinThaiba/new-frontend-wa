import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { type AuthState, type User } from '../../types';

//  Thunks - used for API call
export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: { name: string; email: string; password: string; phone: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/register', data);
      localStorage.setItem('token', res.data.token);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Registration failed');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (data: { phone: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', data);
      localStorage.setItem('token', res.data.token);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Login failed');
    }
  }
);

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me');
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch user');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  } catch (err: any) {
    localStorage.removeItem('token');
    return rejectWithValue(err.response?.data?.message);
  }
});

//  Slice 
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  allUsers: []
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
    updateUserOnlineStatus(state, action: PayloadAction<{ userId: string; isOnline: boolean; lastSeen?: string }>) {
      if (state.user?._id === action.payload.userId) {
        state.user.isOnline = action.payload.isOnline; //payload la save aana value true, so updated is happen
      }
    },
    updateProfile(state, action: PayloadAction<Partial<User>>) { //partial - all properties optional, using Object.assign, they merges payload to user
      if (state.user) Object.assign(state.user, action.payload);
    },
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(registerUser.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Login
    builder.addCase(loginUser.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch Me
    builder.addCase(fetchMe.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchMe.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
    });
    builder.addCase(fetchMe.rejected, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      localStorage.removeItem('token');
    });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    });
  },
});

export const { clearError, updateUserOnlineStatus, updateProfile } = authSlice.actions;
export default authSlice.reducer;
