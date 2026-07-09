import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 90000,
});

export const listCatalogProducts = async (params = {}) => {
  const response = await apiClient.get("/catalog/products", { params });
  return response.data;
};

export const getCatalogProduct = async (productId) => {
  const response = await apiClient.get(`/catalog/products/${productId}`);
  return response.data;
};

export const listCatalogOutfits = async (params = {}) => {
  const response = await apiClient.get("/catalog/outfits", { params });
  return response.data;
};

export const getCatalogShop = async (shopId) => {
  const response = await apiClient.get(`/catalog/shops/${shopId}`);
  return response.data;
};
