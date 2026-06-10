import "server-only";

import { parse } from "csv-parse";
import { createReadStream } from "node:fs";

import { normalizeProduct } from "@/lib/products/normalize";
import type { Product, RawProductRow } from "@/types/product";

const PRODUCTS_CSV_PATH = "data/products.csv";
let productsPromise: Promise<Product[]> | null = null;

export function getProducts(): Promise<Product[]> {
  if (!productsPromise) {
    productsPromise = loadProductsFromCsv();
  }
  return productsPromise;
}

async function loadProductsFromCsv(): Promise<Product[]> {
  const products: Product[] = [];
  const records = createReadStream(PRODUCTS_CSV_PATH, {
    encoding: "utf8",
  }).pipe(
    parse({
      bom: true,
      columns: true,
      relax_column_count: true,
      skip_empty_lines: true,
    }),
  );
  for await (const record of records) {
    if (!isRawProductRow(record)) {
      continue;
    }
    const product = normalizeProduct(record);
    if (product) {
      products.push(product);
    }
  }
  return products;
}

function isRawProductRow(value: unknown): value is RawProductRow {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every(
    (field) => typeof field === "string" || typeof field === "undefined",
  );
}
