import Image from "next/image";

import type { ProductSummary } from "@/types/product";

interface ProductCardProps {
  product: ProductSummary;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <ProductImage product={product} />

      <div className="flex min-h-56 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-secondary">
              {product.vendor}
            </p>
            <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-6 text-zinc-950">
              {product.title}
            </h3>
          </div>
          <AvailabilityBadge available={product.available} />
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-500">
          {product.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-primary-soft px-2.5 py-1 font-medium text-primary">
            {product.productType}
          </span>
          <span className="rounded-full bg-secondary-soft px-2.5 py-1 font-medium text-secondary">
            {product.variantCount}{" "}
            {product.variantCount === 1 ? "variant" : "variants"}
          </span>
        </div>

        <div className="mt-auto pt-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Price
            </p>
            <p className="mt-1 text-base font-semibold text-primary">
              {formatPriceRange(product)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductImage({ product }: { product: ProductSummary }) {
  return (
    <div className="relative aspect-square bg-zinc-100">
      {product.imageUrl ? (
        <Image
          alt=""
          className="object-cover transition duration-300 group-hover:scale-105"
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
          src={product.imageUrl}
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-soft to-secondary-soft">
          <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-white/70 bg-white text-2xl font-semibold text-primary shadow-sm">
            {product.title.slice(0, 2).toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}

function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
        available
          ? "bg-secondary-soft text-secondary"
          : "bg-zinc-100 text-zinc-600"
      }`}
    >
      {available ? "In stock" : "Out of stock"}
    </span>
  );
}

function formatPriceRange(product: ProductSummary): string {
  if (product.minPrice === null && product.maxPrice === null) {
    return "No price";
  }

  const formatter = new Intl.NumberFormat("en-GB", {
    currency: product.currency ?? "GBP",
    maximumFractionDigits: 2,
    style: "currency",
  });
  const min = product.minPrice ?? product.maxPrice;
  const max = product.maxPrice ?? product.minPrice;

  if (min === max || max === null) {
    return formatter.format(min ?? 0);
  }

  return `${formatter.format(min ?? 0)} - ${formatter.format(max)}`;
}
