import { getMongoDb } from "./mongo.service.js";
import { isSubscriptionActive, listPaymentPlans, normalizePlanCode } from "./subscription.service.js";

const TIMEZONE = "Asia/Ho_Chi_Minh";
const DAY_MS = 86_400_000;

const money = (value) => Math.max(0, Math.round(Number(value) || 0));
const localDateKey = (value) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));

const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
const parseDate = (value, endExclusive = false) => {
  if (!value || !dateOnly.test(String(value))) return null;
  const parsed = new Date(`${value}T00:00:00+07:00`);
  return endExclusive ? new Date(parsed.getTime() + DAY_MS) : parsed;
};

export const parseRevenueRange = ({ from, to } = {}, now = new Date()) => {
  const currentKey = localDateKey(now);
  const defaultFrom = `${currentKey.slice(0, 7)}-01`;
  const fromDate = parseDate(from || defaultFrom);
  const toExclusive = parseDate(to || currentKey, true);
  if (!fromDate || !toExclusive || fromDate >= toExclusive) {
    const error = new Error("Khoảng ngày doanh thu không hợp lệ.");
    error.statusCode = 400;
    throw error;
  }
  const maxRangeMs = 366 * DAY_MS;
  if (toExclusive - fromDate > maxRangeMs) {
    const error = new Error("Khoảng báo cáo tối đa là 366 ngày.");
    error.statusCode = 400;
    throw error;
  }
  return {
    from: fromDate,
    toExclusive,
    fromKey: localDateKey(fromDate),
    toKey: localDateKey(new Date(toExclusive.getTime() - 1)),
    timezone: TIMEZONE,
  };
};

const invoiceBreakdown = (invoice) => {
  const result = { tryon_overage: 0, commission: 0, other: 0 };
  for (const entry of invoice?.entries || []) {
    const key = entry.type === "tryon_overage" || entry.type === "commission" ? entry.type : "other";
    result[key] += money(entry.amount);
  }
  return result;
};

const emptyTotals = () => ({ planRevenue: 0, overageRevenue: 0, commissionRevenue: 0, otherRevenue: 0, total: 0, transactions: 0 });

export const summarizeRevenueData = ({ orders = [], owners = [], shops = [], invoices = [], plans = [] }) => {
  const ownerMap = new Map(owners.map((owner) => [owner.id, owner]));
  const shopByOwner = new Map(shops.filter((shop) => shop.ownerId).map((shop) => [shop.ownerId, shop]));
  const invoiceMap = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const planMap = new Map(plans.map((plan) => [plan.code, plan]));
  const planTotals = new Map();
  const shopTotals = new Map();
  const dailyTotals = new Map();
  const transactions = [];

  const ensurePlan = (code, snapshot = {}) => {
    const normalized = normalizePlanCode(code);
    if (!planTotals.has(normalized)) {
      const current = planMap.get(normalized) || {};
      planTotals.set(normalized, {
        planCode: normalized,
        planName: snapshot.name || current.name || normalized,
        revenue: 0,
        transactions: 0,
        payingShops: new Set(),
        newSubscriptions: 0,
        renewals: 0,
        changes: 0,
        grantedSubscriptions: 0,
        activeShops: 0,
      });
    }
    return planTotals.get(normalized);
  };

  for (const plan of plans) ensurePlan(plan.code, plan);
  for (const owner of owners) {
    if (!isSubscriptionActive(owner.subscription) || owner.subscription?.suspendedAt) continue;
    const code = normalizePlanCode(owner.subscription.planCode);
    if (code) ensurePlan(code).activeShops += 1;
  }

  for (const order of orders) {
    if (order.status !== "paid" || money(order.amount) <= 0 || order.grantType) continue;
    if (!ownerMap.has(order.accountId)) continue;
    const amount = money(order.amount);
    const owner = ownerMap.get(order.accountId) || {};
    const shop = shopByOwner.get(order.accountId) || {};
    const invoice = order.invoiceId ? invoiceMap.get(order.invoiceId) : null;
    const breakdown = invoiceBreakdown(invoice);
    const isInvoice = Boolean(order.invoiceId);
    const planCode = isInvoice ? null : normalizePlanCode(order.planCode);
    const planRevenue = isInvoice ? 0 : amount;
    const overageRevenue = isInvoice ? breakdown.tryon_overage : 0;
    const commissionRevenue = isInvoice ? breakdown.commission : 0;
    const knownInvoiceRevenue = overageRevenue + commissionRevenue;
    const otherRevenue = isInvoice ? Math.max(0, amount - knownInvoiceRevenue) : 0;
    const date = localDateKey(order.paidAt || order.updatedAt || order.createdAt);
    const transactionType = isInvoice ? "invoice" : "plan";

    const row = {
      id: order.id,
      orderCode: order.orderCode,
      ownerId: order.accountId,
      ownerName: owner.name || "",
      ownerEmail: owner.email || "",
      shopId: shop.id || null,
      shopName: shop.name || owner.name || owner.email || order.accountId,
      paidAt: order.paidAt || order.updatedAt || order.createdAt,
      amount,
      type: transactionType,
      planCode,
      planName: order.planSnapshot?.name || planMap.get(planCode)?.name || planCode,
      invoiceId: order.invoiceId || null,
      breakdown: {
        tryonOverage: overageRevenue,
        commission: commissionRevenue,
        other: otherRevenue,
      },
      purchaseKind: order.renewalScheduled ? "renewal" : order.previousCycleId ? "change" : "new",
      cycleId: order.cycleId || null,
    };
    transactions.push(row);

    if (planCode) {
      const target = ensurePlan(planCode, order.planSnapshot);
      target.revenue += amount;
      target.transactions += 1;
      target.payingShops.add(order.accountId);
      if (row.purchaseKind === "renewal") target.renewals += 1;
      else if (row.purchaseKind === "change") target.changes += 1;
      else target.newSubscriptions += 1;
    }

    if (!shopTotals.has(order.accountId)) {
      shopTotals.set(order.accountId, {
        ownerId: order.accountId,
        ownerName: owner.name || "",
        ownerEmail: owner.email || "",
        shopId: shop.id || null,
        shopName: shop.name || owner.name || owner.email || order.accountId,
        currentPlanCode: normalizePlanCode(owner.subscription?.planCode) || null,
        ...emptyTotals(),
        lastPaidAt: null,
      });
    }
    const shopTotal = shopTotals.get(order.accountId);
    shopTotal.planRevenue += planRevenue;
    shopTotal.overageRevenue += overageRevenue;
    shopTotal.commissionRevenue += commissionRevenue;
    shopTotal.otherRevenue += otherRevenue;
    shopTotal.total += amount;
    shopTotal.transactions += 1;
    if (!shopTotal.lastPaidAt || new Date(row.paidAt) > new Date(shopTotal.lastPaidAt)) shopTotal.lastPaidAt = row.paidAt;

    if (!dailyTotals.has(date)) dailyTotals.set(date, { date, ...emptyTotals() });
    const daily = dailyTotals.get(date);
    daily.planRevenue += planRevenue;
    daily.overageRevenue += overageRevenue;
    daily.commissionRevenue += commissionRevenue;
    daily.otherRevenue += otherRevenue;
    daily.total += amount;
    daily.transactions += 1;
  }

  for (const order of orders) {
    if (!ownerMap.has(order.accountId)) continue;
    if (!order.grantType && money(order.amount) !== 0) continue;
    if (!order.planCode || order.planCode === "INVOICE") continue;
    ensurePlan(order.planCode, order.planSnapshot).grantedSubscriptions += 1;
  }

  const planRevenue = [...planTotals.values()].reduce((sum, item) => sum + item.revenue, 0);
  const overageRevenue = transactions.reduce((sum, item) => sum + item.breakdown.tryonOverage, 0);
  const commissionRevenue = transactions.reduce((sum, item) => sum + item.breakdown.commission, 0);
  const otherRevenue = transactions.reduce((sum, item) => sum + item.breakdown.other, 0);
  const grossCollected = planRevenue + overageRevenue + commissionRevenue + otherRevenue;
  const outstanding = invoices.filter((invoice) => ["unpaid", "overdue"].includes(invoice.status));
  const outstandingAmount = outstanding.reduce((sum, invoice) => sum + money(invoice.amount), 0);
  const overdueAmount = outstanding.filter((invoice) => invoice.status === "overdue").reduce((sum, invoice) => sum + money(invoice.amount), 0);

  const plansResult = [...planTotals.values()].map((item) => ({
    ...item,
    payingShops: item.payingShops.size,
    share: planRevenue ? item.revenue / planRevenue : 0,
  })).sort((a, b) => b.revenue - a.revenue);

  return {
    summary: {
      grossCollected,
      planRevenue,
      overageRevenue,
      commissionRevenue,
      otherRevenue,
      paidTransactions: transactions.length,
      payingShops: shopTotals.size,
      averageRevenuePerPayingShop: shopTotals.size ? Math.round(grossCollected / shopTotals.size) : 0,
      outstandingAmount,
      overdueAmount,
    },
    plans: plansResult,
    shops: [...shopTotals.values()].sort((a, b) => b.total - a.total),
    transactions: transactions.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)),
    timeSeries: [...dailyTotals.values()].sort((a, b) => a.date.localeCompare(b.date)),
    outstanding: outstanding.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)).map((invoice) => {
      const owner = ownerMap.get(invoice.ownerId) || {};
      const shop = shopByOwner.get(invoice.ownerId) || {};
      return {
        id: invoice.id,
        ownerId: invoice.ownerId,
        ownerName: owner.name || "",
        ownerEmail: owner.email || "",
        shopName: shop.name || owner.name || owner.email || invoice.ownerId,
        amount: money(invoice.amount),
        status: invoice.status,
        issuedAt: invoice.issuedAt,
        dueAt: invoice.dueAt,
        breakdown: invoiceBreakdown(invoice),
      };
    }),
  };
};

export const getAdminRevenueReport = async (query = {}) => {
  const range = parseRevenueRange(query);
  const db = await getMongoDb();
  const [orders, owners, shops, invoices, plans] = await Promise.all([
    db.collection("payment_orders").find({
      status: "paid",
      paidAt: { $gte: range.from, $lt: range.toExclusive },
    }).toArray(),
    db.collection("shop_owners").find({}).toArray(),
    db.collection("shops").find({}).toArray(),
    db.collection("billing_invoices").find({}).toArray(),
    listPaymentPlans(),
  ]);
  const report = summarizeRevenueData({ orders, owners, shops, invoices, plans });
  return {
    range: {
      from: range.from,
      toExclusive: range.toExclusive,
      fromKey: range.fromKey,
      toKey: range.toKey,
      timezone: range.timezone,
    },
    ...report,
  };
};

