import { jsonError } from "@/lib/api/json-error";
import { getProducts } from "@/lib/products/csv";
import { getProductFilters } from "@/lib/products/query";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const products = await getProducts();
    return Response.json(getProductFilters(products));
  } catch {
    return jsonError("FILTERS_LOAD_FAILED", "Unable to load filters", 500);
  }
}
