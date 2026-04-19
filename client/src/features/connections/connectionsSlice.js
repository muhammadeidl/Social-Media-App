import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios.js";

const initialState = {
  connections: [],
  pendingConnections: [],
  followers: [],
  following: [],
  loading: false,
  error: null,
};

export const fetchConnections = createAsyncThunk(
  "connections/fetchConnections",
  async (token, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/user/connections", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!data?.success) {
        return rejectWithValue("فشل جلب الاتصالات");
      }

      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "حدث خطأ في الاتصال بالسيرفر"
      );
    }
  }
);

const connectionsSlice = createSlice({
  name: "connections",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchConnections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConnections.fulfilled, (state, action) => {
        state.loading = false;
        state.connections = action.payload.connections || [];
        state.pendingConnections = action.payload.pendingConnections || [];
        state.followers = action.payload.followers || [];
        state.following = action.payload.following || [];
      })
      .addCase(fetchConnections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حصل خطأ غير متوقع";
      });
  },
});

export default connectionsSlice.reducer;
