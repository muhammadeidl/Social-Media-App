import { createSlice } from "@reduxjs/toolkit";

const savedTheme = localStorage.getItem("theme") || "light";

export const themeSlice = createSlice({
  name: "theme",
  initialState: {
    value: savedTheme,
  },
  reducers: {
    toggleTheme: (state) => {
      const newTheme = state.value === "light" ? "dark" : "light";
      state.value = newTheme;
      localStorage.setItem("theme", newTheme);
    },
    setTheme: (state, action) => {
      state.value = action.payload;
      localStorage.setItem("theme", action.payload);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;

export default themeSlice.reducer;
