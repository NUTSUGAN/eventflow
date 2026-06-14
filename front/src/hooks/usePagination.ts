import { useEffect, useMemo, useState } from 'react'

type UsePaginationOptions = {
  pageSize?: number
  resetKey?: string
}

export function usePagination<T>(
  items: T[],
  { pageSize = 20, resetKey = '' }: UsePaginationOptions = {},
) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [resetKey, pageSize])

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages))
  }, [totalPages])

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize

    return items.slice(startIndex, startIndex + pageSize)
  }, [items, page, pageSize])

  return {
    page,
    pageSize,
    totalPages,
    paginatedItems,
    setPage,
  }
}
