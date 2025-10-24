import axios from "axios";

const axiosAuthentifcation = axios.create({
  baseURL: "https://9c8r7bbvybn.preview.infomaniak.website/api",
  headers: {
    "Content-Type": "application/json"
  },
});

export default axiosAuthentifcation;