import axios from "axios";
import { getUserToken } from "./userApi.js";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 60000,
});

export const createTryOnTask = async (payload) => {
  const response = await apiClient.post("/tryon", payload);

  return response.data;
};

export const getTryOnTaskStatus = async (taskId) => {
  const response = await apiClient.get(`/tryon/${taskId}`);
  return response.data;
};

export const createCatalogTryOnTask = async ({ productId, modelImage }) => {
  const formData = new FormData();
  formData.append("productId", productId);
  if (modelImage) formData.append("image", modelImage);

  const response = await apiClient.post("/tryon/catalog", formData, {
    headers: {
      Authorization: `Bearer ${getUserToken()}`,
    },
  });

  return response.data;
};

export const createCustomTryOnTask = async ({
  tryOnType,
  modelImage,
  dressImage,
  upperImage,
  lowerImage,
}) => {
  const formData = new FormData();
  formData.append("tryOnType", tryOnType);
  if (modelImage) formData.append("modelImage", modelImage);
  if (dressImage) formData.append("dressImage", dressImage);
  if (upperImage) formData.append("upperImage", upperImage);
  if (lowerImage) formData.append("lowerImage", lowerImage);

  const response = await apiClient.post("/tryon/custom", formData, {
    headers: {
      Authorization: `Bearer ${getUserToken()}`,
    },
  });

  return response.data;
};
