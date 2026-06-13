# Shopify Catalog Search

A small Next.js App Router application for searching, filtering, and paginating products from a provided Shopify CSV export.

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Architecture

The CSV file lives in `data/products.csv` and is only read on the server. The frontend never imports, fetches, or searches the raw CSV directly.

Product data flows through three layers:

```txt
CSV row -> normalized Product -> API ProductSummary
```

The server parses the CSV with `csv-parse` because the export contains quoted, multiline JSON fields. Normalization lives in `lib/products/normalize.ts`, query behavior lives in `lib/products/query.ts`, and request validation lives in `lib/products/validation.ts`. The API route handlers are intentionally thin.

Parsed products are cached with a module-level promise in `lib/products/csv.ts`. For this take-home, that avoids reparsing the CSV on every request while keeping the implementation simple.

## API

### `GET /api/products`

Returns active products as paginated JSON.

Query params:

| Param | Description |
| --- | --- |
| `q` | Optional case-insensitive search across title, description and vendor |
| `vendor` | Optional exact vendor filter |
| `productType` | Optional exact product type filter |
| `availability` | `all`, `in_stock` or `out_of_stock` |
| `minPrice` | Optional minimum price |
| `maxPrice` | Optional maximum price |
| `sort` | `title_asc`, `title_desc`, `price_asc` or `price_desc` |
| `page` | Positive integer, defaults to `1` |
| `pageSize` | Positive integer, defaults to `24`, clamped to `50` |

Example:

```txt
/api/products?q=sleep&availability=in_stock&page=1&pageSize=24
```

### `GET /api/products/filters`

Returns the available filter options for the current search, including vendors, product types, availability counts and price bounds.

## Decisions And Trade-Offs

I chose simple case-insensitive partial matching instead of fuzzy search. It is predictable, easy to explain, and meets the assignment requirements. Fuzzy search would improve typo tolerance, but it would require ranking rules and more tests, making the implementation more complex.

Availability is based on product-level `TOTAL_INVENTORY > 0`. In production, I would revisit this with variant-level inventory and Shopify availability rules.

The app scans and filters an in-memory array on each request. That is acceptable for this CSV-backed take-home, but it is not the right design for a large catalogue.

## Left Out

- URL-synced search and filter state.
- Debounced search input.
- Automated tests for normalization, validation, and query behavior.
- Fuzzy search or relevance ranking beyond deterministic sorting.

## With More Time

I would add focused server-side tests first, especially around CSV normalization, invalid query params, price filtering, and pagination edge cases. I would also sync the UI state to the URL so searches are shareable and browser back/forward works naturally.

For a catalogue of 500,000 products, I would move search and filter counts out of the in-memory request path. A SQL database with proper indexes would be a practical next step, especially for exact filters like vendor, product type, availability and price. If the search needed better relevance ranking, typo tolerance or more advanced filtering, I would consider Elasticsearch or a similar search index.
