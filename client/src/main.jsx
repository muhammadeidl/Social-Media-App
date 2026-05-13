import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
import { Provider } from "react-redux";
import { store } from "./app/store.js";
import ErrorBoundary from "./components/ErrorBoundary";

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

createRoot(document.getElementById("root")).render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY}
    signInForceRedirectUrl="/"
    signUpForceRedirectUrl="/"
  >
    <BrowserRouter>
      <Provider store={store}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </Provider>
    </BrowserRouter>
  </ClerkProvider>
);
