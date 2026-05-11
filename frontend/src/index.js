import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./styles.css";

const isMetaMaskExtensionError = (text = "") => {
  const value = String(text).toLowerCase();
  return (
    value.includes("metamask") ||
    value.includes("chrome-extension://") ||
    value.includes("inpage.js")
  );
};

window.addEventListener("error", (event) => {
  const message = event?.message || event?.error?.message || "";

  if (isMetaMaskExtensionError(message)) {
    event.preventDefault();
  }
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event?.reason;
  const message =
    (typeof reason === "string" && reason) ||
    reason?.message ||
    String(reason || "");

  if (isMetaMaskExtensionError(message)) {
    event.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
