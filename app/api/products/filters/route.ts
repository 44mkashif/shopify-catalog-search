import type { NextRequest } from "next/server";

import { jsonError } from "@/lib/api/json-error";
import { getProducts } from "@/lib/products/csv";
import { getProductFilters } from "@/lib/products/query";
import { parseProductFiltersQuery } from "@/lib/products/validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<Response> {
  const { query, error } = parseProductFiltersQuery(
    request.nextUrl.searchParams,
  );
  if (!query) {
    return jsonError("INVALID_QUERY", error || "Invalid query params", 400);
  }
  try {
    const products = await getProducts();
    return Response.json(getProductFilters(products, query));
  } catch {
    return jsonError("FILTERS_LOAD_FAILED", "Unable to load filters", 500);
  }
}
