import type { ProductsErrorResponse } from "@/types/product";

export function jsonError(
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
