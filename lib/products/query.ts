import type {
  Product,
  ProductFilterOption,
  ProductFiltersResponse,
  ProductSummary,
  ProductsQuery,
  ProductsResponse,
} from "@/types/product";

export function getProductsPage(
  products: Product[],
  query: ProductsQuery,
): ProductsResponse {
  const filteredProducts = applyQuery(products, query);
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / query.pageSize);
  const start = (query.page - 1) * query.pageSize;
  const data = filteredProducts
    .slice(start, start + query.pageSize)
    .map(toProductSummary);
  return {
    data,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      totalItems,
      totalPages,
    },
  };
}

export function getProductFilters(products: Product[]): ProductFiltersResponse {
  const activeProducts = products.filter(
    (product) => product.status === "ACTIVE",
  );
  const vendors = new Map<string, ProductFilterOption>();
  const productTypes = new Map<string, ProductFilterOption>();
  const currencies = new Map<string, ProductFilterOption>();
  let minPrice: number | null = null;
  let maxPrice: number | null = null;
  let inStock = 0;
  for (const product of activeProducts) {
    incrementOption(vendors, product.vendor);
    incrementOption(productTypes, product.productType);
    if (product.currency) {
      incrementOption(currencies, product.currency);
    }
    if (product.available) {
      inStock += 1;
    }
    const productMinPrice = product.minPrice ?? product.maxPrice;
    const productMaxPrice = product.maxPrice ?? product.minPrice;
    if (productMinPrice !== null) {
      minPrice =
        minPrice === null
          ? productMinPrice
          : Math.min(minPrice, productMinPrice);
    }
    if (productMaxPrice !== null) {
      maxPrice =
        maxPrice === null
          ? productMaxPrice
          : Math.max(maxPrice, productMaxPrice);
    }
  }
  return {
    vendors: sortOptions(vendors),
    productTypes: sortOptions(productTypes),
    availability: {
      all: activeProducts.length,
      inStock,
      outOfStock: activeProducts.length - inStock,
    },
    price: {
      min: minPrice,
      max: maxPrice,
    },
    currencies: sortOptions(currencies),
  };
}

function applyQuery(products: Product[], query: ProductsQuery): Product[] {
  const searchQuery = normalizeForSearch(query.q);
  return products
    .filter((product) => product.status === "ACTIVE")
    .filter((product) => matchesSearch(product, searchQuery))
    .filter((product) => matchesExactFilter(product.vendor, query.vendor))
    .filter((product) =>
      matchesExactFilter(product.productType, query.productType),
    )
    .filter((product) => matchesAvailability(product, query.availability))
    .filter((product) => matchesPriceRange(product, query))
    .sort((left, right) => compareProducts(left, right, searchQuery));
}

function matchesSearch(
  product: Product,
  searchQuery: string | undefined,
): boolean {
  if (!searchQuery) {
    return true;
  }
  return (
    normalizeForSearch(product.title).includes(searchQuery) ||
    normalizeForSearch(product.description).includes(searchQuery) ||
    normalizeForSearch(product.vendor).includes(searchQuery)
  );
}

function matchesExactFilter(
  productValue: string,
  filterValue: string | undefined,
): boolean {
  if (!filterValue) {
    return true;
  }
  return normalizeForSearch(productValue) === normalizeForSearch(filterValue);
}

function matchesAvailability(
  product: Product,
  availability: ProductsQuery["availability"],
): boolean {
  if (availability === "in_stock") {
    return product.available;
  }
  if (availability === "out_of_stock") {
    return !product.available;
  }
  return true;
}

function matchesPriceRange(product: Product, query: ProductsQuery): boolean {
  if (query.minPrice === undefined && query.maxPrice === undefined) {
    return true;
  }
  // This fallback value handles imperfect data where only one side of the product price range exists.
  const productMinPrice = product.minPrice ?? product.maxPrice;
  const productMaxPrice = product.maxPrice ?? product.minPrice;
  if (productMinPrice === null || productMaxPrice === null) {
    return false;
  }
  if (query.minPrice !== undefined && productMaxPrice < query.minPrice) {
    return false;
  }
  if (query.maxPrice !== undefined && productMinPrice > query.maxPrice) {
    return false;
  }
  return true;
}

function incrementOption(
  options: Map<string, ProductFilterOption>,
  value: string,
): void {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return;
  }
  const key = normalizeForSearch(trimmedValue);
  const option = options.get(key);
  if (option) {
    option.count += 1;
    return;
  }
  options.set(key, {
    value: trimmedValue,
    count: 1,
  });
}

function sortOptions(
  options: Map<string, ProductFilterOption>,
): ProductFilterOption[] {
  return Array.from(options.values()).sort((left, right) =>
    left.value.localeCompare(right.value),
  );
}

function compareProducts(
  left: Product,
  right: Product,
  searchQuery: string | undefined,
): number {
  if (searchQuery) {
    // Lower ranks are better and a negative sort result keeps left before right
    const rankDifference =
      getSearchRank(left, searchQuery) - getSearchRank(right, searchQuery);
    if (rankDifference !== 0) {
      return rankDifference;
    }
  }
  return left.title.localeCompare(right.title);
}

function getSearchRank(product: Product, searchQuery: string): number {
  const title = normalizeForSearch(product.title);
  const vendor = normalizeForSearch(product.vendor);
  const description = normalizeForSearch(product.description);
  // Lower ranks are better: title matches beat vendor matches, then descriptions
  if (title.startsWith(searchQuery)) {
    return 1;
  }
  if (title.includes(searchQuery)) {
    return 2;
  }
  if (vendor.includes(searchQuery)) {
    return 3;
  }
  if (description.includes(searchQuery)) {
    return 4;
  }
  return 5;
}

function normalizeForSearch(value: string | undefined): string {
  const normalized = value?.trim().toLowerCase();
  return normalized || "";
}

function toProductSummary(product: Product): ProductSummary {
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    vendor: product.vendor,
    description: product.description,
    productType: product.productType,
    minPrice: product.minPrice,
    maxPrice: product.maxPrice,
    currency: product.currency,
    imageUrl: product.imageUrl,
    available: product.available,
    variantCount: product.variantCount,
  };
}
