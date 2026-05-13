import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (token, thunkAPI) => {
    try {
      const response = await api.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async ({ notificationId = null, token }, thunkAPI) => {
    try {
      const response = await api.post(
        "/api/notifications/mark-read",
        { notificationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { notificationId, success: response.data.success };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteAllNotifications = createAsyncThunk(
  "notifications/deleteAll",
  async (token, thunkAPI) => {
    try {
      const response = await api.delete(
        "/api/notifications/delete-all",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: response.data.success };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action) => {
      // Avoid duplicate notifications based on _id
      const exists = state.items.find((n) => n._id === action.payload._id);
      if (!exists) {
        state.items.unshift(action.payload);
        if (!action.payload.read) {
          state.unreadCount += 1;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.items = action.payload.notifications;
          state.unreadCount = action.payload.notifications.filter(n => !n.read).length;
        } else {
          state.error = action.payload.message;
        }
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        if (action.payload.success) {
          if (action.payload.notificationId) {
            const notification = state.items.find(n => n._id === action.payload.notificationId);
            if (notification && !notification.read) {
              notification.read = true;
              state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
          } else {
            state.items.forEach(n => n.read = true);
            state.unreadCount = 0;
          }
        }
      })
      .addCase(deleteAllNotifications.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.items = [];
          state.unreadCount = 0;
        }
      });
  },
});

export const { addNotification } = notificationsSlice.actions;

export default notificationsSlice.reducer;
