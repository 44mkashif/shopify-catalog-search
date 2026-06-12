import type { ChangeEvent } from "react";

import type {
  ProductAvailability,
  ProductFilterOption,
  ProductFiltersResponse,
} from "@/types/product";

interface PriceBounds {
  min: number | null;
  max: number | null;
}

interface ProductFiltersProps {
  vendors: ProductFilterOption[];
  productTypes: ProductFilterOption[];
  availability: ProductFiltersResponse["availability"];
  price: PriceBounds;
  values: ProductFilterValues;
  disabled?: boolean;
  onChange: (values: ProductFilterValues) => void;
  onAvailabilityChange: (availability: ProductAvailability) => void;
  onReset: () => void;
}

const availabilityOptions: Array<{
  label: string;
  value: ProductAvailability;
}> = [
  { label: "All", value: "all" },
  { label: "In stock", value: "in_stock" },
  { label: "Out of stock", value: "out_of_stock" },
];

export interface ProductFilterValues {
  q: string;
  vendor: string;
  productType: string;
  availability: ProductAvailability;
  minPrice: string;
  maxPrice: string;
}

export function ProductFilters({
  vendors,
  productTypes,
  availability,
  price,
  values,
  disabled = false,
  onChange,
  onAvailabilityChange,
  onReset,
}: ProductFiltersProps) {
  const availabilityCounts: Record<ProductAvailability, number> = {
    all: availability.all,
    in_stock: availability.inStock,
    out_of_stock: availability.outOfStock,
  };

  function updateValue(
    key: keyof ProductFilterValues,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    onChange({ ...values, [key]: event.target.value });
  }

  return (
    <aside className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Filters</h2>
        </div>
        <button
          className="text-xs font-medium text-zinc-500 transition hover:text-primary"
          disabled={disabled}
          onClick={onReset}
          type="button"
        >
          Reset
        </button>
      </div>

      <form className="mt-4 space-y-5">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Search
          </span>
          <input
            className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-primary focus:ring-4 focus:ring-primary-soft"
            disabled={disabled}
            onChange={(event) => updateValue("q", event)}
            placeholder="Search products"
            type="search"
            value={values.q}
          />
        </label>

        <FilterSelect
          disabled={disabled}
          label="Vendor"
          onChange={(event) => updateValue("vendor", event)}
          options={vendors}
          placeholder="Any vendor"
          value={values.vendor}
        />

        <FilterSelect
          disabled={disabled}
          label="Product type"
          onChange={(event) => updateValue("productType", event)}
          options={productTypes}
          placeholder="Any type"
          value={values.productType}
        />

        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Availability
          </legend>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {availabilityOptions.map((option) => (
              <label
                className="flex cursor-pointer items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm transition has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-white"
                key={option.value}
              >
                <span>{option.label}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs opacity-70">
                    {availabilityCounts[option.value]}
                  </span>
                  <input
                    className="sr-only"
                    checked={values.availability === option.value}
                    disabled={disabled}
                    name="availability"
                    onChange={() => onAvailabilityChange(option.value)}
                    type="radio"
                    value={option.value}
                  />
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Price
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label>
              <span className="sr-only">Minimum price</span>
              <input
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-primary focus:ring-4 focus:ring-primary-soft"
                disabled={disabled}
                inputMode="decimal"
                onChange={(event) => updateValue("minPrice", event)}
                placeholder="Min"
                type="text"
                value={values.minPrice}
              />
            </label>
            <label>
              <span className="sr-only">Maximum price</span>
              <input
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-primary focus:ring-4 focus:ring-primary-soft"
                disabled={disabled}
                inputMode="decimal"
                onChange={(event) => updateValue("maxPrice", event)}
                placeholder="Max"
                type="text"
                value={values.maxPrice}
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            Catalog range: {price.min ?? "-"} to {price.max ?? "-"}
          </p>
        </fieldset>
      </form>
    </aside>
  );
}

interface FilterSelectProps {
  label: string;
  options: ProductFilterOption[];
  placeholder: string;
  value: string;
  disabled: boolean;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}

function FilterSelect({
  label,
  options,
  placeholder,
  value,
  disabled,
  onChange,
}: FilterSelectProps) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <select
        className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary-soft"
        disabled={disabled}
        onChange={onChange}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.value} ({option.count})
          </option>
        ))}
      </select>
    </label>
  );
}
