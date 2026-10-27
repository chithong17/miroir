import axios from "axios";
import { getUserToken } from "./userApi.js";
import { mixCatalogProducts } from "../lib/catalogOrder.js";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 90000,
});

apiClient.interceptors.request.use((config) => {
  const token = getUserToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const visitSeed = Math.floor(Math.random() * 2147483647);
const mixedCatalogCache = new Map();
const loadProducts = async (params) => (await apiClient.get("/catalog/products", { params })).data;

// Older API deployments lack mixed ordering. Fetch their stable pages once,
// mix the complete result, and paginate only after mixing.
const loadLegacyMixedCatalog = async (filters) => {
  const first = await loadProducts({ ...filters, page: 1, limit: 48 });
  const products = [...first.products];
  for (let start = 2; start <= first.pagination.totalPages; start += 4) {
    const pages = await Promise.all(Array.from(
      { length: Math.min(4, first.pagination.totalPages - start + 1) },
      (_, i) => loadProducts({ ...filters, page: start + i, limit: 48 }),
    ));
    for (const page of pages) products.push(...page.products);
  }
  const unique = [...new Map(products.map((product) => [product.id, product])).values()];
  return { ...first, products: mixCatalogProducts(unique, visitSeed) };
};

export const listCatalogProducts = async (params = {}) => {
  const { page: requestedPage, limit: requestedLimit, ...filters } = params;
  const page = Math.max(1, Number.parseInt(requestedPage, 10) || 1);
  const limit = Math.min(48, Math.max(1, Number.parseInt(requestedLimit, 10) || 12));
  const key = JSON.stringify(Object.entries(filters).sort(([a], [b]) => a.localeCompare(b)));
  let entry = mixedCatalogCache.get(key);
  if (!entry || Date.now() - entry.createdAt > 60000) {
    const response = await loadProducts(params);
    if (response.pagination?.order === "mixed") return response;
    const promise = loadLegacyMixedCatalog(filters).catch((error) => {
      mixedCatalogCache.delete(key);
      throw error;
    });
    entry = { promise, createdAt: Date.now() };
    mixedCatalogCache.set(key, entry);
    if (mixedCatalogCache.size > 6) mixedCatalogCache.delete(mixedCatalogCache.keys().next().value);
  }
  const result = await entry.promise;
  const total = result.products.length;
  return {
    ...result,
    products: result.products.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), order: "mixed" },
  };
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

export const submitProductFeedback = async (productId, payload) => {
  const response = await apiClient.post(`/catalog/products/${productId}/feedback`, payload);
  return response.data;
};
