export const NEWS_PAGE_SIZE = 10;

// Malformed or out-of-range URLs still resolve to a useful, bounded page.
export function paginateNews(items, value) {
  const pageCount = Math.max(1, Math.ceil(items.length / NEWS_PAGE_SIZE));
  const requested = /^\d+$/.test(String(value ?? "")) ? Number(value) : 1;
  const page = Math.min(pageCount, Math.max(1, Number.isSafeInteger(requested) ? requested : 1));
  return { news: items.slice((page - 1) * NEWS_PAGE_SIZE, page * NEWS_PAGE_SIZE), page, pageCount };
}
