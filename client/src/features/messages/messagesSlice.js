import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios.js";

const initialState = {
  messages: [],
};

export const fetchMessages = createAsyncThunk(
  "messages/fetchMessages",
  async ({ token, userId }) => {
    const { data } = await api.post(
      "/api/message/get",
      { to_user_id: userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.success ? data : null;
  }
);

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages = [...state.messages, action.payload];
    },
    resetMessages: (state) => {
      state.messages = [];
    },
    removeMessage: (state, action) => {
      state.messages = state.messages.filter((msg) => msg._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMessages.fulfilled, (state, action) => {
      if (action.payload) {
        state.messages = action.payload.messages;
      }
    });
  },
});

export const { setMessages, addMessage, resetMessages, removeMessage } = messagesSlice.actions;
export default messagesSlice.reducer;
