import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getMongoDb } from "./mongo.service.js";
import { getShopDashboard, getShopInsights } from "./shopAnalytics.service.js";

const isTemporaryAiFailure = (error) => {
  const status = Number(error.status || error.response?.status);
  return [429, 500, 502, 503, 504].includes(status) ||
    /\b(429|500|502|503|504)\b|high demand|service unavailable/i.test(error.message || "");
};

export const generateShopReportWithRetry = async (generateContent, wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await generateContent();
    } catch (error) {
      const temporary = isTemporaryAiFailure(error);
      if (!temporary || attempt === 2) {
        console.error("Shop AI report generation failed:", error);
        const serviceError = new Error(temporary ? "Dịch vụ AI đang bận. Vui lòng thử lại sau." : "Không tạo được phân tích AI lúc này. Vui lòng thử lại sau.");
        serviceError.statusCode = temporary ? 503 : 502;
        throw serviceError;
      }
      await wait(500 * (attempt + 1));
    }
  }
};

const generate = async ({ data, strategic }) => {
  if (!process.env.GEMINI_API_KEY) { const error = new Error("Gemini is not configured."); error.statusCode = 503; throw error; }
  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = client.getGenerativeModel({ model: process.env.GEMINI_GENERATION_MODEL || "gemini-2.5-flash" });
  const instruction = strategic
    ? "Viết báo cáo tư vấn chiến lược kinh doanh cho shop: 3 ưu tiên, bằng chứng số liệu, rủi ro và hành động tháng tới. Phân tích Style & Budget nếu có dữ liệu."
    : "Đề xuất ngắn gọn về giá, bảng size, và promotion cho shop, mỗi đề xuất dẫn số liệu có thật. Không tự thay đổi giá hay tạo chương trình khuyến mãi.";
  const prompt = `${instruction}\nChỉ dùng dữ liệu JSON sau. Không bịa số liệu; nếu thiếu dữ liệu thì ghi rõ chưa đủ dữ liệu. Không suy luận thông tin từng khách hàng.\n${JSON.stringify(data)}`;
  const text = await generateShopReportWithRetry(async () => {
    const response = await model.generateContent(prompt);
    const result = response.response.text().trim();
    if (!result) throw new Error("AI did not return a report.");
    return result;
  });
  return text;
};

export const getGrowthAdvice = async (ownerId) => {
  const db = await getMongoDb();
  const key = `${ownerId}:${new Date().toISOString().slice(0, 10)}`;
  const previous = await db.collection("shop_advice").findOne({ key });
  if (previous) return previous;
  const dashboard = await getShopDashboard({ ownerId, range: "30d" });
  const data = { summary: dashboard.summary, finance: dashboard.finance, inventoryHealth: dashboard.inventoryHealth, topProducts: dashboard.topProducts, fitFinder: dashboard.fitFinder };
  const advice = { id: crypto.randomUUID(), key, ownerId, text: await generate({ data, strategic: false }), data, createdAt: new Date() };
  try { await db.collection("shop_advice").insertOne(advice); return advice; }
  catch (error) { if (error.code === 11000) return db.collection("shop_advice").findOne({ key }); throw error; }
};

export const getProStrategyReport = async ({ ownerId, cycleId }) => {
  if (!cycleId) { const error = new Error("Active billing cycle is required."); error.statusCode = 409; throw error; }
  const db = await getMongoDb();
  const previous = await db.collection("shop_strategy_reports").findOne({ ownerId, cycleId });
  if (previous) return previous;
  const [dashboard, insights] = await Promise.all([getShopDashboard({ ownerId, range: "30d" }), getShopInsights({ ownerId, range: "30d" })]);
  const data = { summary: dashboard.summary, finance: dashboard.finance, inventoryHealth: dashboard.inventoryHealth, topProducts: dashboard.topProducts, insights: insights.enoughData ? insights.breakdowns : { enoughData: false, message: insights.message } };
  const report = { id: crypto.randomUUID(), ownerId, cycleId, text: await generate({ data, strategic: true }), data, createdAt: new Date(), source: "AI" };
  try { await db.collection("shop_strategy_reports").insertOne(report); return report; }
  catch (error) { if (error.code === 11000) return db.collection("shop_strategy_reports").findOne({ ownerId, cycleId }); throw error; }
};

export const runStrategyReportWorker = async () => {
  const db = await getMongoDb();
  const cycles = await db.collection("billing_cycles").find({ planCode: "PRO_INSIGHT", status: "open" }).sort({ startsAt: 1 }).limit(20).toArray();
  for (const cycle of cycles) {
    const existing = await db.collection("shop_strategy_reports").findOne({ ownerId: cycle.ownerId, cycleId: cycle.id });
    if (existing) continue;
    try { await getProStrategyReport({ ownerId: cycle.ownerId, cycleId: cycle.id }); }
    catch (error) { console.error(`Strategy report generation failed for ${cycle.id}:`, error); }
  }
};
