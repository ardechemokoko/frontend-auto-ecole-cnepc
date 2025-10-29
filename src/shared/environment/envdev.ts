import axios from "axios";
import { getBaseURL } from "./config";

const axiosClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json"
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;