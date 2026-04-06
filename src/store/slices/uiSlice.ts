import { createSlice } from '@reduxjs/toolkit';
import { type UIState } from '../../types';

const initialState: UIState = {
  showContactInfo: false,
  showNewChat: false,
  showSettings: false,
  showCreateGroup: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleContactInfo: (state) => { state.showContactInfo = !state.showContactInfo; },
    closeContactInfo: (state) => { state.showContactInfo = false; },
    toggleNewChat: (state) => { state.showNewChat = !state.showNewChat; },
    closeNewChat: (state) => { state.showNewChat = false; },
    toggleSettings: (state) => { state.showSettings = !state.showSettings; },
    closeSettings: (state) => { state.showSettings = false; },
    toggleCreateGroup: (s) => { s.showCreateGroup = !s.showCreateGroup; },
  },
});

export const { toggleContactInfo, closeContactInfo, toggleNewChat, closeNewChat, toggleSettings, closeSettings,toggleCreateGroup } = uiSlice.actions;

export default uiSlice.reducer;
