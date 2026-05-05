import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Клієнтська пагінація повного масиву (слайс + номер сторінки).
 * Використовуй для вкладок пошуку тощо; серверна пагінація — окремо в батьківському стані.
 */
export function usePagedSlice<T>(items: readonly T[], pageSize: number) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(items.length / pageSize));
    setPage((p) => Math.min(p, maxPage));
  }, [items.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const shownFrom = items.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const shownTo = items.length === 0 ? 0 : Math.min(items.length, page * pageSize);

  const resetToFirstPage = useCallback(() => setPage(1), []);

  return {
    page,
    setPage,
    resetToFirstPage,
    totalPages,
    pagedItems,
    shownFrom,
    shownTo,
  };
}
