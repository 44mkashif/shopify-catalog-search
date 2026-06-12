import { z } from "zod";

import type { ProductsQuery } from "@/types/product";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 50;

const trimmedOptionalString = z
  .string()
  .trim()
  .transform((value) => (value ? value : undefined))
  .optional();

const positiveInteger = z.coerce.number().int().positive();

const optionalPrice = z.coerce.number().nonnegative().optional();

const productsQuerySchema = z
  .object({
    q: trimmedOptionalString,
    vendor: trimmedOptionalString,
    productType: trimmedOptionalString,
    availability: z.enum(["all", "in_stock", "out_of_stock"]).default("all"),
    sort: z
      .enum(["title_asc", "title_desc", "price_asc", "price_desc"])
      .default("title_asc"),
    minPrice: optionalPrice,
    maxPrice: optionalPrice,
    page: positiveInteger.default(DEFAULT_PAGE),
    pageSize: positiveInteger
      .default(DEFAULT_PAGE_SIZE)
      .transform((pageSize) => Math.min(pageSize, MAX_PAGE_SIZE)),
  })
  .refine(
    (query) =>
      query.minPrice === undefined ||
      query.maxPrice === undefined ||
      query.minPrice <= query.maxPrice,
    {
      message: "minPrice must be less than or equal to maxPrice",
      path: ["minPrice"],
    },
  );

export function parseProductsQuery(searchParams: URLSearchParams): {
  query: ProductsQuery | null;
  error: string | null;
} {
  const parsed = productsQuerySchema.safeParse(
    searchParamsToValidationObject(searchParams),
  );
  if (!parsed.success) {
    return {
      query: null,
      error: parsed.error.issues[0]?.message ?? "Invalid query params",
    };
  }
  return {
    query: parsed.data,
    error: null,
  };
}

function searchParamsToValidationObject(
  searchParams: URLSearchParams,
): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of searchParams) {
    const trimmed = value.trim();
    if (trimmed) {
      query[key] = trimmed;
    }
  }
  return query;
}
