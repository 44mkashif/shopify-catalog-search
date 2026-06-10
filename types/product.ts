export type RawProductRow = Record<string, string | undefined>;

export interface Product {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  description: string;
  productType: string;
  status: string;
  minPrice: number | null;
  maxPrice: number | null;
  currency: string | null;
  imageUrl: string | null;
  totalInventory: number;
  available: boolean;
  tags: string[];
  variantIds: string[];
  variantCount: number;
}
