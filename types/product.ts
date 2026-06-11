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

export interface ProductSummary {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  description: string;
  productType: string;
  minPrice: number | null;
  maxPrice: number | null;
  currency: string | null;
  imageUrl: string | null;
  available: boolean;
  variantCount: number;
}

export type ProductAvailability = "all" | "in_stock" | "out_of_stock";

export interface ProductsQuery {
  q?: string;
  vendor?: string;
  productType?: string;
  availability: ProductAvailability;
  minPrice?: number;
  maxPrice?: number;
  page: number;
  pageSize: number;
}

export interface ProductsResponse {
  data: ProductSummary[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ProductFilterOption {
  value: string;
  count: number;
}

export interface ProductFiltersResponse {
  vendors: ProductFilterOption[];
  productTypes: ProductFilterOption[];
  availability: {
    all: number;
    inStock: number;
    outOfStock: number;
  };
  price: {
    min: number | null;
    max: number | null;
  };
  currencies: ProductFilterOption[];
}

export interface ProductsErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
