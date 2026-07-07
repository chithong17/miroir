import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const TOKEN_KEY = "miroir_shop_owner_token";

export const getShopToken = () => localStorage.getItem(TOKEN_KEY) || "";

export const setShopToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

const shopClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000,
});

shopClient.interceptors.request.use((config) => {
  const token = getShopToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const registerShopOwner = async (payload) => {
  const response = await shopClient.post("/shop-auth/register", payload);
  return response.data;
};

export const loginShopOwner = async (payload) => {
  const response = await shopClient.post("/shop-auth/login", payload);
  return response.data;
};

export const listMyShops = async () => {
  const response = await shopClient.get("/shops/me");
  return response.data;
};

export const createShop = async (payload) => {
  const response = await shopClient.post("/shops", payload);
  return response.data;
};

export const updateShop = async (id, payload) => {
  const response = await shopClient.put(`/shops/${id}`, payload);
  return response.data;
};

export const deleteShop = async (id) => {
  const response = await shopClient.delete(`/shops/${id}`);
  return response.data;
};

export const listShopProducts = async (params = {}) => {
  const response = await shopClient.get("/shop-products", { params });
  return response.data;
};

export const createProduct = async (payload) => {
  const response = await shopClient.post("/shop-products", payload);
  return response.data;
};

export const updateProduct = async (id, payload) => {
  const response = await shopClient.put(`/shop-products/${id}`, payload);
  return response.data;
};

export const archiveProduct = async (id) => {
  const response = await shopClient.patch(`/shop-products/${id}/archive`);
  return response.data;
};

export const restoreProduct = async (id) => {
  const response = await shopClient.patch(`/shop-products/${id}/restore`);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await shopClient.delete(`/shop-products/${id}`);
  return response.data;
};

export const hardDeleteProduct = async (id) => {
  const response = await shopClient.delete(`/shop-products/${id}/permanent`);
  return response.data;
};

export const uploadProductImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await shopClient.post("/shop-products/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const downloadProductImportTemplate = async () => {
  const response = await shopClient.get("/shop-products/import-template", {
    responseType: "blob",
  });
  return response.data;
};

export const importProductsExcel = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await shopClient.post("/shop-products/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
