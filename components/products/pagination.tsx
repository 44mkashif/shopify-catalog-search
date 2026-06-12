import type { ReactNode } from "react";

interface PaginationProps {
  page: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalItems: number;
  totalPages: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

interface PageButtonProps {
  current: boolean;
  disabled: boolean;
  onClick: () => void;
  page: number;
}

interface PaginationButtonProps {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}

interface PageSizeSelectProps {
  disabled: boolean;
  onPageSizeChange: (pageSize: number) => void;
  pageSize: number;
  pageSizeOptions: number[];
}

export function Pagination({
  page,
  pageSize,
  pageSizeOptions,
  totalItems,
  totalPages,
  disabled = false,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);
  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <nav
      aria-label="Products pagination"
      className="flex min-w-0 flex-col gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="shrink-0 text-zinc-500">
          Showing{" "}
          <span className="font-medium text-primary">
            {startItem}-{endItem}
          </span>{" "}
          of <span className="font-medium text-primary">{totalItems}</span>
        </p>
        <PageSizeSelect
          disabled={disabled}
          onPageSizeChange={onPageSizeChange}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
        />
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <PaginationButton
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </PaginationButton>

        {visiblePages.map((pageItem, index) =>
          pageItem === "ellipsis" ? (
            <span
              aria-hidden="true"
              className="flex h-9 min-w-7 items-center justify-center text-zinc-400"
              key={`ellipsis-${index}`}
            >
              ...
            </span>
          ) : (
            <PageButton
              current={pageItem === page}
              disabled={disabled}
              key={pageItem}
              onClick={() => onPageChange(pageItem)}
              page={pageItem}
            />
          ),
        )}

        <PaginationButton
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </PaginationButton>
      </div>
    </nav>
  );
}

function PageSizeSelect({
  disabled,
  onPageSizeChange,
  pageSize,
  pageSizeOptions,
}: PageSizeSelectProps) {
  return (
    <label className="flex items-center gap-2 text-zinc-500">
      Per page
      <select
        className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-950 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onChange={(event) => onPageSizeChange(Number(event.target.value))}
        value={pageSize}
      >
        {pageSizeOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PageButton({
  current,
  disabled,
  onClick,
  page,
}: PageButtonProps) {
  return (
    <button
      aria-current={current ? "page" : undefined}
      aria-label={`Go to page ${page}`}
      className={`h-9 min-w-9 rounded-md border px-3 text-sm font-medium transition ${
        current
          ? "border-primary bg-primary text-white"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
      }`}
      disabled={disabled || current}
      onClick={onClick}
      type="button"
    >
      {page}
    </button>
  );
}

function PaginationButton({
  children,
  disabled = false,
  onClick,
}: PaginationButtonProps) {
  return (
    <button
      className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

type VisiblePage = number | "ellipsis";

function getVisiblePages(page: number, totalPages: number): VisiblePage[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const nearStart = page <= 4;
  const nearEnd = page >= totalPages - 3;
  if (nearStart) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }
  if (nearEnd) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const visiblePages = Array.from(pages)
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((left, right) => left - right);
  return visiblePages.flatMap((pageNumber, index) => {
    const previousPage = visiblePages[index - 1];
    if (previousPage && pageNumber - previousPage > 1) {
      return ["ellipsis", pageNumber];
    }
    return [pageNumber];
  });
}
