import axios from "axios";
import { getUserToken } from "./userApi.js";
import { getShopToken } from "./shopApi.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const client = axios.create({ baseURL: API_BASE_URL, timeout: 90000 });
client.interceptors.request.use((config) => {
  const token = getUserToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getCart = async () => (await client.get("/users/me/cart")).data;
export const addCartItem = async (payload) => (await client.post("/users/me/cart/items", payload)).data;
export const updateCartItem = async (productId, variantId, quantity) => (await client.put(`/users/me/cart/items/${encodeURIComponent(productId)}/${encodeURIComponent(variantId)}`, { quantity })).data;
export const removeCartItem = async (productId, variantId) => (await client.delete(`/users/me/cart/items/${encodeURIComponent(productId)}/${encodeURIComponent(variantId)}`)).data;
export const selectCartAddress = async (addressId) => (await client.patch("/users/me/cart/address", { addressId })).data;
export const previewBuyNow = async (items) => (await client.post("/orders/buy-now/preview", { items })).data;
export const checkoutCart = async (payload) => (await client.post("/orders/checkout", payload)).data;
export const listMyOrders = async (params) => (await client.get("/orders/me", { params })).data;
export const getMyOrder = async (id) => (await client.get(`/orders/me/${encodeURIComponent(id)}`)).data;
export const cancelMyOrder = async (id, reason) => (await client.post(`/orders/me/${encodeURIComponent(id)}/cancel`, { reason })).data;
export const reportMyTransfer = async (id, image) => {
  const form = new FormData();
  if (image) form.append("image", image);
  return (await client.post(`/orders/me/${encodeURIComponent(id)}/transfer-reported`, form, { headers: { "Content-Type": "multipart/form-data" } })).data;
};

export const listAddresses = async () => (await client.get("/users/me/addresses")).data;
export const createAddress = async (payload) => (await client.post("/users/me/addresses", payload)).data;
export const updateAddress = async (id, payload) => (await client.put(`/users/me/addresses/${encodeURIComponent(id)}`, payload)).data;
export const setDefaultAddress = async (id) => (await client.patch(`/users/me/addresses/${encodeURIComponent(id)}/default`)).data;
export const deleteAddress = async (id) => (await client.delete(`/users/me/addresses/${encodeURIComponent(id)}`)).data;
export const listProvinces = async () => (await client.get("/locations/provinces")).data;
export const listWards = async (provinceCode) => (await client.get(`/locations/provinces/${encodeURIComponent(provinceCode)}/wards`)).data;

export const listNotifications = async () => (await client.get("/notifications")).data;
export const readNotification = async (id) => (await client.patch(`/notifications/${encodeURIComponent(id)}/read`)).data;
export const createRefundDispute = async (orderId, message, images = []) => {
  const form = new FormData(); form.append("message", message); images.slice(0, 3).forEach((image) => form.append("images", image));
  return (await client.post(`/orders/me/${encodeURIComponent(orderId)}/disputes`, form, { headers: { "Content-Type": "multipart/form-data" } })).data;
};
export const listMyDisputes = async () => (await client.get("/orders/disputes/me")).data;
export const replyMyDispute = async (id, message, images = []) => {
  const form = new FormData(); form.append("message", message); images.slice(0, 3).forEach((image) => form.append("images", image));
  return (await client.post(`/orders/disputes/me/${encodeURIComponent(id)}/messages`, form, { headers: { "Content-Type": "multipart/form-data" } })).data;
};

const shopClient = axios.create({ baseURL: API_BASE_URL, timeout: 90000 });
shopClient.interceptors.request.use((config) => {
  const token = getShopToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const listShopOrders = async (params) => (await shopClient.get("/shop-orders", { params })).data;
export const getShopOrder = async (id) => (await shopClient.get(`/shop-orders/${encodeURIComponent(id)}`)).data;
export const updateShopOrderStatus = async (id, status, reason) => (await shopClient.patch(`/shop-orders/${encodeURIComponent(id)}/status`, { status, reason })).data;
export const decideShopCancellation = async (id, approved, reason) => (await shopClient.patch(`/shop-orders/${encodeURIComponent(id)}/cancellation`, { approved, reason })).data;
export const updateShopOrderPayment = async (id, action, reason, image) => {
  const form = new FormData();
  form.append("action", action);
  if (reason) form.append("reason", reason);
  if (image) form.append("image", image);
  return (await shopClient.patch(`/shop-orders/${encodeURIComponent(id)}/payment`, form, { headers: { "Content-Type": "multipart/form-data" } })).data;
};
export const listShopNotifications = async () => (await shopClient.get("/shop-notifications")).data;
export const readShopNotification = async (id) => (await shopClient.patch(`/shop-notifications/${encodeURIComponent(id)}/read`)).data;
export const listOwnerDisputes = async () => (await shopClient.get("/shop-orders/disputes/all")).data;
export const replyOwnerDispute = async (id, message, images = []) => {
  const form = new FormData(); form.append("message", message); images.slice(0, 3).forEach((image) => form.append("images", image));
  return (await shopClient.post(`/shop-orders/disputes/${encodeURIComponent(id)}/messages`, form, { headers: { "Content-Type": "multipart/form-data" } })).data;
};
