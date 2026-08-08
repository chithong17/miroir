import axios from "axios";
import { getUserToken } from "./userApi.js";

const client = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api", timeout: 90000 });
client.interceptors.request.use((config) => { const token = getUserToken(); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
export const getFitRecommendation = async (payload) => (await client.post("/fit/recommendations", payload)).data;
export const trackFitEvent = async (payload) => (await client.post("/fit/events", payload)).data;
