import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 90000,
});

export const getStylistRecommendation = async (payload) => {
  const response = await apiClient.post("/stylist/recommend", payload);
  return response.data;
};

export const submitStylistFeedback = async (payload) => {
  const response = await apiClient.post("/stylist/feedback", payload);
  return response.data;
};
