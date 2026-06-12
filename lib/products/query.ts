import type {
  Product,
  ProductFilterOption,
  ProductFiltersQuery,
  ProductFiltersResponse,
  ProductSort,
  ProductSummary,
  ProductsQuery,
  ProductsResponse,
} from "@/types/product";

export function getProductsPage(
  products: Product[],
  query: ProductsQuery,
): ProductsResponse {
  const filteredProducts = filterProducts(products, query).sort((left, right) =>
    compareProducts(left, right, query.sort),
  );
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

export function getProductFilters(
  products: Product[],
  query?: ProductFiltersQuery,
): ProductFiltersResponse {
  const currentProducts = query
    ? filterProducts(products, query)
    : getActiveProducts(products);
  const vendorProducts = query
    ? filterProducts(products, { ...query, vendor: undefined })
    : currentProducts;
  const productTypeProducts = query
    ? filterProducts(products, { ...query, productType: undefined })
    : currentProducts;
  const availabilityProducts = query
    ? filterProducts(products, { ...query, availability: "all" })
    : currentProducts;
  const priceProducts = query
    ? filterProducts(products, {
        ...query,
        maxPrice: undefined,
        minPrice: undefined,
      })
    : currentProducts;

  return {
    vendors: getOptions(vendorProducts, (product) => product.vendor),
    productTypes: getOptions(
      productTypeProducts,
      (product) => product.productType,
    ),
    availability: getAvailabilityCounts(availabilityProducts),
    price: getPriceRange(priceProducts),
    currencies: getOptions(currentProducts, (product) => product.currency),
  };
}

function getActiveProducts(products: Product[]): Product[] {
  return products.filter((product) => product.status === "ACTIVE");
}

function filterProducts(
  products: Product[],
  query: ProductFiltersQuery,
): Product[] {
  const searchQuery = normalizeForSearch(query.q);
  return products
    .filter((product) => product.status === "ACTIVE")
    .filter((product) => matchesSearch(product, searchQuery))
    .filter((product) => matchesExactFilter(product.vendor, query.vendor))
    .filter((product) =>
      matchesExactFilter(product.productType, query.productType),
    )
    .filter((product) => matchesAvailability(product, query.availability))
    .filter((product) => matchesPriceRange(product, query));
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
  availability: ProductFiltersQuery["availability"],
): boolean {
  if (availability === "in_stock") {
    return product.available;
  }
  if (availability === "out_of_stock") {
    return !product.available;
  }
  return true;
}

function matchesPriceRange(product: Product, query: ProductFiltersQuery): boolean {
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
  value: string | null,
): void {
  const trimmedValue = value?.trim();
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

function getOptions(
  products: Product[],
  getValue: (product: Product) => string | null,
): ProductFilterOption[] {
  const options = new Map<string, ProductFilterOption>();
  for (const product of products) {
    incrementOption(options, getValue(product));
  }
  return sortOptions(options);
}

function getAvailabilityCounts(products: Product[]) {
  const inStock = products.filter((product) => product.available).length;
  return {
    all: products.length,
    inStock,
    outOfStock: products.length - inStock,
  };
}

function getPriceRange(products: Product[]): ProductFiltersResponse["price"] {
  let minPrice: number | null = null;
  let maxPrice: number | null = null;
  for (const product of products) {
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
    min: minPrice,
    max: maxPrice,
  };
}

function sortOptions(
  options: Map<string, ProductFilterOption>,
): ProductFilterOption[] {
  return Array.from(options.values()).sort((left, right) =>
    left.value.localeCompare(right.value),
  );
}

function compareProducts(left: Product, right: Product, sort: ProductSort) {
  if (sort === "title_desc") {
    return compareTitles(right, left);
  }
  if (sort === "price_asc") {
    return comparePrices(left, right) || compareTitles(left, right);
  }
  if (sort === "price_desc") {
    return comparePrices(right, left) || compareTitles(left, right);
  }
  return compareTitles(left, right);
}

function compareTitles(left: Product, right: Product): number {
  return left.title.localeCompare(right.title);
}

function comparePrices(left: Product, right: Product): number {
  const leftPrice = getSortablePrice(left);
  const rightPrice = getSortablePrice(right);
  if (leftPrice === null && rightPrice === null) {
    return 0;
  }
  if (leftPrice === null) {
    return 1;
  }
  if (rightPrice === null) {
    return -1;
  }
  return leftPrice - rightPrice;
}

function getSortablePrice(product: Product): number | null {
  return product.minPrice ?? product.maxPrice;
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
