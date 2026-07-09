import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const TOKEN_KEY = "miroir_admin_token";

export const getAdminToken = () => localStorage.getItem(TOKEN_KEY) || "";

export const setAdminToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

const adminClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000,
});

adminClient.interceptors.request.use((config) => {
  const token = getAdminToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const loginAdmin = async (payload) => {
  const response = await adminClient.post("/admin-auth/login", payload);
  return response.data;
};

export const getAdminMe = async () => {
  const response = await adminClient.get("/admin-auth/me");
  return response.data;
};

export const listShopOwners = async (params = {}) => {
  const response = await adminClient.get("/admin/shop-owners", { params });
  return response.data;
};

export const approveShopOwner = async (ownerId) => {
  const response = await adminClient.patch(`/admin/shop-owners/${ownerId}/approve`);
  return response.data;
};

export const rejectShopOwner = async (ownerId) => {
  const response = await adminClient.patch(`/admin/shop-owners/${ownerId}/reject`);
  return response.data;
};

export const deactivateShopOwner = async (ownerId) => {
  const response = await adminClient.patch(`/admin/shop-owners/${ownerId}/deactivate`);
  return response.data;
};

export const listAdminShops = async (params = {}) => {
  const response = await adminClient.get("/admin/shops", { params });
  return response.data;
};

export const createAdminShop = async (payload) => {
  const response = await adminClient.post("/admin/shops", payload);
  return response.data;
};

export const updateAdminShop = async (shopId, payload) => {
  const response = await adminClient.put(`/admin/shops/${shopId}`, payload);
  return response.data;
};

export const deleteAdminShop = async (shopId) => {
  const response = await adminClient.delete(`/admin/shops/${shopId}`);
  return response.data;
};

export const listAdminProducts = async (shopId, params = {}) => {
  const response = await adminClient.get(`/admin/shops/${shopId}/products`, { params });
  return response.data;
};

export const createAdminProduct = async (shopId, payload) => {
  const response = await adminClient.post(`/admin/shops/${shopId}/products`, payload);
  return response.data;
};

export const updateAdminProduct = async (productId, payload) => {
  const response = await adminClient.put(`/admin/products/${productId}`, payload);
  return response.data;
};

export const deleteAdminProduct = async (productId) => {
  const response = await adminClient.delete(`/admin/products/${productId}`);
  return response.data;
};

export const archiveAdminProduct = async (productId) => {
  const response = await adminClient.patch(`/admin/products/${productId}/archive`);
  return response.data;
};

export const restoreAdminProduct = async (productId) => {
  const response = await adminClient.patch(`/admin/products/${productId}/restore`);
  return response.data;
};

export const exportAdminProducts = async (shopId, mode = "all") => {
  const response = await adminClient.get(`/admin/shops/${shopId}/products/export`, {
    params: { mode },
    responseType: "blob",
  });
  return response.data;
};

export const importAdminProducts = async (shopId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await adminClient.post(`/admin/shops/${shopId}/products/import`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
