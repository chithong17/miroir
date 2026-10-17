import { request } from './client';
export interface Breakdown {label:string;count:number}
export interface ProductMetric {productId:string;name:string;quantity?:number;collectedRevenue?:number;views?:number;tryOns?:number;stylistMatches?:number;feedbackCount?:number;averageRating?:number}
export interface Dashboard {tier?:string;summary:Record<string,number>;inventoryHealth?:Record<string,number>;funnel?:Record<string,number>;finance?:Record<string,number|null>;salesSeries?:Record<string,string|number>[];orderStatusBreakdown?:Breakdown[];paymentStatusBreakdown?:Breakdown[];topProducts?:ProductMetric[];fitFinder?:{opened:number;recommended:number;applied:number;addToCart:number;checkout:number;sizeReturnCount:number;totalReturns:number;sizeReturnRate:number;confidenceDistribution:Breakdown[];feedback:Record<string,number>};dataQuality?:{containsMockData:boolean;mockOrderCount:number;realOrderCount:number}}
export interface Analytics {summary:Record<string,number>;timeSeries?:Record<string,string|number>[];topProducts?:ProductMetric[]}
export interface Insights {enoughData:boolean;message?:string;eventCount:number;userCount:number;minimumEvents?:number;breakdowns?:Record<string,Breakdown[]>}
export const analyticsApi = {
  dashboard: async (token:string,range:string) => (await request<{dashboard:Dashboard}>('GET','/shops/me/dashboard',token,undefined,{range})).dashboard,
  analytics: async (token:string,range:string) => (await request<{analytics:Analytics}>('GET','/shops/me/analytics',token,undefined,{range})).analytics,
  insights: async (token:string,range:string) => (await request<{insights:Insights}>('GET','/shops/me/insights',token,undefined,{range})).insights,
};
