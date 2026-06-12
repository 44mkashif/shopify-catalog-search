"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Pagination } from "@/components/products/pagination";
import {
  ProductFilters,
  type ProductFilterValues,
} from "@/components/products/product-filters";
import { ProductGrid } from "@/components/products/product-grid";
import type {
  ProductAvailability,
  ProductFiltersResponse,
  ProductSort,
  ProductsResponse,
} from "@/types/product";

const DEFAULT_PAGE_SIZE = 6;
const PAGE_SIZE_OPTIONS = [6, 12, 24, 48];
const DEFAULT_SORT: ProductSort = "title_asc";

const SORT_OPTIONS: Array<{
  label: string;
  value: ProductSort;
}> = [
  { label: "Title A-Z", value: "title_asc" },
  { label: "Title Z-A", value: "title_desc" },
  { label: "Price Low-High", value: "price_asc" },
  { label: "Price High-Low", value: "price_desc" },
];

const defaultFilterValues: ProductFilterValues = {
  q: "",
  vendor: "",
  productType: "",
  availability: "all",
  minPrice: "",
  maxPrice: "",
};

const emptyFilters: ProductFiltersResponse = {
  vendors: [],
  productTypes: [],
  availability: {
    all: 0,
    inStock: 0,
    outOfStock: 0,
  },
  price: {
    min: null,
    max: null,
  },
  currencies: [],
};

export function ProductCatalog() {
  const [filters, setFilters] =
    useState<ProductFilterValues>(defaultFilterValues);
  const [filterOptions, setFilterOptions] =
    useState<ProductFiltersResponse>(emptyFilters);
  const [productsResponse, setProductsResponse] =
    useState<ProductsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<ProductSort>(DEFAULT_SORT);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      availability: filters.availability,
      page: String(page),
      pageSize: String(pageSize),
      sort,
    });
    appendParam(params, "q", filters.q);
    appendParam(params, "vendor", filters.vendor);
    appendParam(params, "productType", filters.productType);
    appendParam(params, "minPrice", filters.minPrice);
    appendParam(params, "maxPrice", filters.maxPrice);
    return params.toString();
  }, [filters, page, pageSize, sort]);

  useEffect(() => {
    async function loadFilters() {
      try {
        const response = await fetch("/api/products/filters");
        if (!response.ok) {
          throw new Error("Unable to load filters");
        }
        const data = (await response.json()) as ProductFiltersResponse;
        setFilterOptions(data);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setIsLoadingFilters(false);
      }
    }
    loadFilters();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadProducts() {
      setIsLoadingProducts(true);
      setError(null);
      try {
        const response = await fetch(`/api/products?${queryString}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Unable to load products");
        }
        const data = (await response.json()) as ProductsResponse;
        setProductsResponse(data);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setProductsResponse(null);
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingProducts(false);
        }
      }
    }
    loadProducts();
    return () => {
      controller.abort();
    };
  }, [queryString]);

  function updateFilters(nextFilters: ProductFilterValues) {
    setFilters(nextFilters);
    setPage(1);
  }

  function updateAvailability(availability: ProductAvailability) {
    updateFilters({ ...filters, availability });
  }

  function updatePageSize(nextPageSize: number) {
    setPageSize(nextPageSize);
    setPage(1);
  }

  function updateSort(nextSort: ProductSort) {
    setSort(nextSort);
    setPage(1);
  }

  const products = productsResponse?.data ?? [];
  const pagination = productsResponse?.pagination;

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <ProductFilters
        availability={filterOptions.availability}
        disabled={isLoadingFilters}
        onAvailabilityChange={updateAvailability}
        onChange={updateFilters}
        onReset={() => updateFilters(defaultFilterValues)}
        price={filterOptions.price}
        productTypes={filterOptions.productTypes}
        values={filters}
        vendors={filterOptions.vendors}
      />

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">
              Product results
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {isLoadingProducts
                ? "Loading products..."
                : `${pagination?.totalItems ?? 0} matching products`}
            </p>
          </div>
          <SortMenu
            disabled={isLoadingProducts}
            onChange={updateSort}
            value={sort}
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : isLoadingProducts ? (
          <ProductGridSkeleton />
        ) : products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyProducts />
        )}

        {!error && pagination ? (
          <Pagination
            disabled={isLoadingProducts}
            onPageChange={setPage}
            onPageSizeChange={updatePageSize}
            page={pagination.page}
            pageSize={pagination.pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
          />
        ) : null}
      </div>
    </div>
  );
}

function appendParam(params: URLSearchParams, key: string, value: string) {
  const trimmedValue = value.trim();
  if (trimmedValue) {
    params.set(key, trimmedValue);
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

interface SortMenuProps {
  disabled: boolean;
  onChange: (sort: ProductSort) => void;
  value: ProductSort;
}

function SortMenu({ disabled, onChange, value }: SortMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption =
    SORT_OPTIONS.find((option) => option.value === value) ?? SORT_OPTIONS[0];

  function selectSort(nextSort: ProductSort) {
    onChange(nextSort);
    setIsOpen(false);
  }

  return (
    <div className="relative w-48">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Sort
      </span>
      <button
        className="mt-2 flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 text-left text-sm text-zinc-950 outline-none transition hover:border-zinc-300 focus:border-primary focus:ring-4 focus:ring-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onBlur={() => setIsOpen(false)}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-zinc-400"
          strokeWidth={2}
        />
      </button>

      {isOpen && !disabled ? (
        <div className="absolute right-0 z-10 mt-1 w-full overflow-hidden rounded-md border border-zinc-200 bg-white py-1 text-sm shadow-lg">
          {SORT_OPTIONS.map((option) => (
            <button
              className={`flex w-full cursor-pointer items-center px-3 py-2 text-left transition hover:bg-primary-soft hover:text-primary ${
                option.value === value
                  ? "bg-primary-soft font-medium text-primary"
                  : "text-zinc-700"
              }`}
              key={option.value}
              onMouseDown={(event) => {
                event.preventDefault();
                selectSort(option.value);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: DEFAULT_PAGE_SIZE }, (_, index) => (
        <div
          className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
          key={index}
        >
          <div className="aspect-square animate-pulse bg-zinc-100" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-100" />
            <div className="h-5 w-4/5 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
      ))}
    </section>
  );
}

function EmptyProducts() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm">
      <h3 className="text-base font-semibold text-zinc-950">
        No products found
      </h3>
      <p className="mt-2 text-sm text-zinc-500">
        Try changing the search term or clearing a filter.
      </p>
    </div>
  );
}
