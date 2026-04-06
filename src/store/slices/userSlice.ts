import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";
import { type UserState} from "../../types/index"

const initialState: UserState = {
  blockedUsers: [],
  loading: false,
};

//BLOCK USER
export const blockUser = createAsyncThunk(
  "users/blockUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const res = await api.post(`/users/block/${userId}`);
      return res.data.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

//UNBLOCK USER
export const unblockUser = createAsyncThunk(
  "users/unblockUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      await api.post(`/users/unblock/${userId}`);
      return userId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

//FETCH BLOCKED USERS
export const fetchBlockedUsers = createAsyncThunk(
  "users/fetchBlocked",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/users/blocked");
      return res.data.users;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      // fetch
      .addCase(fetchBlockedUsers.fulfilled, (state, action) => {
        state.blockedUsers = action.payload;
      })

      // block
     .addCase(blockUser.fulfilled, (state, action) => {
      const list = state.blockedUsers || [];
      
      const exists = list.some( (u) => u._id === action.payload._id);
      if (!exists) {
         state.blockedUsers = [...list, action.payload];
        }
      })

      // unblock
      .addCase(unblockUser.fulfilled, (state, action) => {
        state.blockedUsers = state.blockedUsers.filter((u) => u._id !== action.payload);
      });
  },
});

export default userSlice.reducer;