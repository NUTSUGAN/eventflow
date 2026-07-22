import { useCallback, useMemo, useState } from 'react'

type UsePaginationOptions = {
  pageSize?: number
  resetKey?: string
}

export function usePagination<T>(
  items: T[],
  { pageSize = 20, resetKey = '' }: UsePaginationOptions = {},
) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const [paginationState, setPaginationState] = useState({
    page: 1,
    pageSize,
    resetKey,
  })

  const shouldReset =
    paginationState.resetKey !== resetKey || paginationState.pageSize !== pageSize

  if (shouldReset) {
    setPaginationState({
      page: 1,
      pageSize,
      resetKey,
    })
  }

  const page = Math.min(shouldReset ? 1 : paginationState.page, totalPages)

  const setPage = useCallback(
    (nextPage: number | ((currentPage: number) => number)) => {
      setPaginationState((currentState) => {
        const currentPage =
          currentState.resetKey === resetKey && currentState.pageSize === pageSize
            ? Math.min(currentState.page, totalPages)
            : 1
        const resolvedPage =
          typeof nextPage === 'function' ? nextPage(currentPage) : nextPage

        return {
          page: Math.min(Math.max(1, resolvedPage), totalPages),
          pageSize,
          resetKey,
        }
      })
    },
    [pageSize, resetKey, totalPages],
  )

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
