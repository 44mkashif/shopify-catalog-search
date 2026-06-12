import { convert } from "html-to-text";

import type { Product, RawProductRow } from "@/types/product";

interface ParsedPriceRange {
  minPrice: number | null;
  maxPrice: number | null;
  currency: string | null;
}

const DEFAULT_PRODUCT_TYPE = "Uncategorized";

export function normalizeProduct(row: RawProductRow): Product | null {
  const id = cleanString(row.ID);
  const title = cleanString(row.TITLE);
  if (!id || !title) {
    return null;
  }
  const handle = cleanString(row.HANDLE);
  const vendor = cleanString(row.VENDOR);
  const productType = cleanString(row.PRODUCT_TYPE) || DEFAULT_PRODUCT_TYPE;
  const status = cleanString(row.STATUS);
  const htmlDescription =
    cleanString(row.DESCRIPTION_HTML) || cleanString(row.BODY_HTML);
  const description =
    cleanString(row.DESCRIPTION) || htmlToPlainText(htmlDescription);
  const totalInventory = parseInteger(row.TOTAL_INVENTORY);
  const tags = parseTags(row.TAGS);
  const variantIds = parseVariantIds(row.VARIANTS);
  const { minPrice, maxPrice, currency } = parsePriceRange(
    row.PRICE_RANGE_V2 || row.PRICE_RANGE,
  );
  const imageUrl = parseFeaturedImageUrl(row.FEATURED_IMAGE);
  return {
    id,
    title,
    handle,
    vendor,
    description,
    productType,
    status,
    minPrice,
    maxPrice,
    currency,
    imageUrl,
    totalInventory,
    available: totalInventory > 0,
    tags,
    variantIds,
    variantCount: variantIds.length,
  };
}

function cleanString(value: string | undefined): string {
  return value?.trim() ?? "";
}

function parseInteger(value: string | undefined): number {
  const parsed = Number.parseInt(cleanString(value), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseTags(value: string | undefined): string[] {
  return cleanString(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseVariantIds(value: string | undefined): string[] {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed
    .map((variant) => {
      if (!isRecord(variant)) {
        return null;
      }
      const id = variant.id;
      if (typeof id === "string") {
        return id.trim() || null;
      }
      if (typeof id === "number" && Number.isFinite(id)) {
        return String(id);
      }
      return null;
    })
    .filter((id): id is string => id !== null);
}

function parsePriceRange(value: string | undefined): ParsedPriceRange {
  const parsed = parseJson(value);
  if (!isRecord(parsed)) {
    return { minPrice: null, maxPrice: null, currency: null };
  }
  const minVariantPrice = readPrice(parsed.min_variant_price);
  const maxVariantPrice = readPrice(parsed.max_variant_price);
  return {
    minPrice: minVariantPrice.amount,
    maxPrice: maxVariantPrice.amount,
    currency: minVariantPrice.currency || maxVariantPrice.currency,
  };
}

function readPrice(value: unknown): {
  amount: number | null;
  currency: string | null;
} {
  if (!isRecord(value)) {
    return { amount: null, currency: null };
  }
  return {
    amount: parseAmount(value.amount),
    currency:
      typeof value.currency_code === "string" ? value.currency_code : null,
  };
}

function parseAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseFeaturedImageUrl(value: string | undefined): string | null {
  const parsed = parseJson(value);
  if (!isRecord(parsed) || typeof parsed.url !== "string") {
    return null;
  }
  const url = parsed.url.trim();
  return url || null;
}

function parseJson(value: string | undefined): unknown {
  const cleaned = cleanString(value);
  if (!cleaned) {
    return null;
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function htmlToPlainText(value: string): string {
  if (!value) {
    return "";
  }
  return convert(value, { wordwrap: false }).replace(/\s+/g, " ").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
