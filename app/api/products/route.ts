import type { NextRequest } from "next/server";

import { getProducts } from "@/lib/products/csv";
import { getProductsPage } from "@/lib/products/query";
import { parseProductsQuery } from "@/lib/products/validation";
import type { ProductsErrorResponse } from "@/types/product";

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

function jsonError(
  code: string,
  message: string,
  status: number,
): Response {
  const body: ProductsErrorResponse = {
    error: {
      code,
      message,
    },
  };
  return Response.json(body, { status });
}
