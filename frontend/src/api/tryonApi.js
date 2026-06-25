import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 60000,
});

export const createTryOnTask = async (payload) => {
  const response = await apiClient.post("/tryon", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getTryOnTaskStatus = async (taskId) => {
  const response = await apiClient.get(`/tryon/${taskId}`);
  return response.data;
};
