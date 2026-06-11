import type { NextRequest } from "next/server";

import { jsonError } from "@/lib/api/json-error";
import { getProducts } from "@/lib/products/csv";
import { getProductsPage } from "@/lib/products/query";
import { parseProductsQuery } from "@/lib/products/validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<Response> {
  const { query, error } = parseProductsQuery(request.nextUrl.searchParams);
  if (!query) {
    return jsonError("INVALID_QUERY", error || "Invalid query params", 400);
  }
  try {
    const products = await getProducts();
    return Response.json(getProductsPage(products, query));
  } catch {
    return jsonError("PRODUCTS_LOAD_FAILED", "Unable to load products", 500);
  }
}
