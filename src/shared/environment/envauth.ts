import axios from "axios";

const axiosAuthentifcation = axios.create({
  baseURL: "https://api.artech-agency.site/api",
  headers: {
    "Content-Type": "application/json"
  },
});

export default axiosAuthentifcation;