// src/api/axiosConfig.js
import axios from "axios";

export const setAxiosDefaults = () => {
  axios.defaults.baseURL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  axios.defaults.withCredentials = true;

  axios.defaults.headers = {
    "Content-Type": "application/json",
  };
};