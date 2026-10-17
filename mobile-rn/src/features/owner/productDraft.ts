import { OwnerVariant } from '../../api/ownerProducts';
export interface VariantDraft {id?: string; sku: string; color: string; size: string; stockQuantity: string; active: boolean; costPrice?: number | null; fitMeasurements?: Record<string, number>}
export function parseVariants(drafts: VariantDraft[]): Omit<OwnerVariant, 'id'>[] {
  const skus = new Set<string>();
  return drafts.map(draft => {
    const sku = draft.sku.trim().toUpperCase(); const stockQuantity = Number(draft.stockQuantity);
    if (!sku) throw new Error('Every variant needs a SKU.');
    if (skus.has(sku)) throw new Error(`Duplicate SKU: ${sku}`);
    if (!draft.stockQuantity.trim() || !Number.isInteger(stockQuantity) || stockQuantity < 0) throw new Error(`Enter valid stock for ${sku}.`);
    skus.add(sku);
    return {...draft, sku, color: draft.color.trim(), size: draft.size.trim(), stockQuantity};
  });
}
