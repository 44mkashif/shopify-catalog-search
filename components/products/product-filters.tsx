import { useMemo, useState } from "react";
import { X } from "lucide-react";

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

  function updateValue(key: keyof ProductFilterValues, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <aside className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Filters</h2>
        </div>
        <button
          className="cursor-pointer text-xs font-medium text-zinc-500 transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="relative mt-2">
            <input
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 pr-12 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-primary focus:ring-4 focus:ring-primary-soft"
              disabled={disabled}
              onChange={(event) => updateValue("q", event.target.value)}
              placeholder="Search products"
              type="text"
              value={values.q}
            />
            {values.q ? (
              <ClearInputButton
                label="Clear search"
                disabled={disabled}
                onClick={() => updateValue("q", "")}
              />
            ) : null}
          </div>
        </label>

        <AutocompleteFilterInput
          key={`vendor-${values.vendor}`}
          disabled={disabled}
          label="Vendor"
          onChange={(value) => updateValue("vendor", value)}
          options={vendors}
          placeholder="Any vendor"
          value={values.vendor}
        />

        <AutocompleteFilterInput
          key={`product-type-${values.productType}`}
          disabled={disabled}
          label="Product type"
          onChange={(value) => updateValue("productType", value)}
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
                onChange={(event) => updateValue("minPrice", event.target.value)}
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
                onChange={(event) => updateValue("maxPrice", event.target.value)}
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

interface AutocompleteFilterInputProps {
  label: string;
  options: ProductFilterOption[];
  placeholder: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

function AutocompleteFilterInput({
  label,
  options,
  placeholder,
  value,
  disabled,
  onChange,
}: AutocompleteFilterInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const filteredOptions = useMemo(() => {
    const normalizedSearch = inputValue.trim().toLowerCase();
    if (!normalizedSearch) {
      return options;
    }
    return options.filter((option) =>
      option.value.toLowerCase().includes(normalizedSearch),
    );
  }, [inputValue, options]);

  function updateInput(nextValue: string) {
    setInputValue(nextValue);
    setIsOpen(true);
  }

  function selectOption(nextValue: string) {
    onChange(nextValue);
    setInputValue(nextValue);
    setIsOpen(false);
  }

  function clearSelection() {
    onChange("");
    setInputValue("");
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 pr-12 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-primary focus:ring-4 focus:ring-primary-soft"
          disabled={disabled}
          onBlur={() => setIsOpen(false)}
          onChange={(event) => updateInput(event.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          type="text"
          value={inputValue}
        />
        {value ? (
          <ClearInputButton
            label={`Clear ${label.toLowerCase()}`}
            disabled={disabled}
            onClick={(event) => {
              event.preventDefault();
              clearSelection();
            }}
          />
        ) : null}
      </div>
      {isOpen && !disabled ? (
        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 text-sm shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left text-zinc-700 transition hover:bg-primary-soft hover:text-primary"
                key={option.value}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectOption(option.value);
                }}
                type="button"
              >
                <span className="truncate">{option.value}</span>
                <span className="shrink-0 text-xs text-zinc-400">
                  {option.count}
                </span>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-zinc-400">No matches</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

interface ClearInputButtonProps {
  label: string;
  disabled: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function ClearInputButton({
  label,
  disabled,
  onClick,
}: ClearInputButtonProps) {
  return (
    <button
      aria-label={label}
      className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition hover:bg-primary-soft hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onMouseDown={onClick}
      type="button"
    >
      <X aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}
