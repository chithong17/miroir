import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const TOKEN_KEY = "miroir_user_token";

export const getUserToken = () => localStorage.getItem(TOKEN_KEY) || "";

export const setUserToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

const userClient = axios.create({ baseURL: API_BASE_URL, timeout: 90000 });

userClient.interceptors.request.use((config) => {
  const token = getUserToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const registerUser = async (payload) => {
  const response = await userClient.post("/user-auth/register", payload);
  return response.data;
};

export const loginUser = async (payload) => {
  const response = await userClient.post("/user-auth/login", payload);
  return response.data;
};

export const getUserMe = async () => {
  const response = await userClient.get("/user-auth/me");
  return response.data;
};

export const saveUserProfile = async (payload) => {
  const response = await userClient.put("/users/me/profile", payload);
  return response.data;
};

export const skipUserProfile = async () => {
  const response = await userClient.patch("/users/me/profile/skip");
  return response.data;
};

export const uploadUserProfilePhoto = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await userClient.post("/users/me/profile-photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const listUserFavoriteProducts = async () => {
  const response = await userClient.get("/users/me/favorites");
  return response.data;
};

export const toggleUserFavoriteProduct = async (productId) => {
  const response = await userClient.post(`/users/me/favorites/${encodeURIComponent(productId)}/toggle`);
  return response.data;
};

export const createUserPayment = async () => {
  const response = await userClient.post("/payments/create", {
    planCode: "USER_PREMIUM_MONTHLY",
  });
  return response.data;
};

export const getUserPaymentMe = async () => {
  const response = await userClient.get("/payments/me");
  return response.data;
};

export const getPaymentStatus = async (orderCode) => {
  const response = await userClient.get(`/payments/status/${orderCode}`);
  return response.data;
};

export const listPaymentPlans = async () => {
  const response = await userClient.get("/payments/plans");
  return response.data;
};
