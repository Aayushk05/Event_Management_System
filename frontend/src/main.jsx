import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#17171f",
              color: "#f1f5f9",
              border: "1px solid #1e1e2e",
              fontFamily: "DM Sans, sans-serif",
            },
            success: { iconTheme: { primary: "#f59e0b", secondary: "#09090f" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#09090f" } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
