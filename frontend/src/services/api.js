import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    if (status === 401) {
      const path = window.location.pathname;
      if (!path.startsWith("/login")) {
        localStorage.removeItem("sc_token");
        localStorage.removeItem("sc_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
