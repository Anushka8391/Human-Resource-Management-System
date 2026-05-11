import axios from "axios";

const resolveApiBaseURL = () => {
  const envApiUrl = process.env.REACT_APP_API_URL?.trim();

  if (!envApiUrl) {
    return process.env.NODE_ENV === "development"
      ? "http://localhost:5000/api"
      : "/api";
  }

  // Vercel frontend runs on HTTPS; force HTTPS API URL in production to avoid mixed-content blocks.
  if (process.env.NODE_ENV === "production" && envApiUrl.startsWith("http://")) {
    return `https://${envApiUrl.slice("http://".length)}`;
  }

  return envApiUrl;
};

const apiBaseURL = resolveApiBaseURL();

const api = axios.create({
  baseURL: apiBaseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
