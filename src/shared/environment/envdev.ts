import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://9c8r7bbvybn.preview.infomaniak.website/api",
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