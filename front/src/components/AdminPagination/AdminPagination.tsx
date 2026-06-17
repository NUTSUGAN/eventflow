import {
  AdminDashboardPagination,
  AdminDashboardPaginationButton,
  AdminDashboardPaginationSummary,
} from '../../pages/AdminDashboardPage/adminDashboardPageElements'

type AdminPaginationProps = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  itemLabel: string
  onPageChange: (page: number) => void
}

function buildPageTokens(currentPage: number, totalPages: number): Array<number | string> {
  const pages = new Set<number>([
    1,
    totalPages,
    currentPage,
    currentPage - 1,
    currentPage + 1,
  ])

  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right)

  const tokens: Array<number | string> = []

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1]

    if (previousPage && page - previousPage > 1) {
      tokens.push(`ellipsis-${previousPage}-${page}`)
    }

    tokens.push(page)
  })

  return tokens
}

export function AdminPagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  itemLabel,
  onPageChange,
}: AdminPaginationProps) {
  if (totalItems <= pageSize) {
    return null
  }

  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, totalItems)
  const pageTokens = buildPageTokens(page, totalPages)

  return (
    <AdminDashboardPagination aria-label={`Pagination ${itemLabel}`}>
      <AdminDashboardPaginationSummary>
        {startItem}-{endItem} / {totalItems} {itemLabel}
      </AdminDashboardPaginationSummary>
      <AdminDashboardPaginationButton
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Page precedente"
      >
        {'<'}
      </AdminDashboardPaginationButton>
      {pageTokens.map((token) =>
        typeof token === 'number' ? (
          <AdminDashboardPaginationButton
            key={token}
            type="button"
            $active={token === page}
            onClick={() => onPageChange(token)}
            aria-label={`Aller à la page ${token}`}
          >
            {token}
          </AdminDashboardPaginationButton>
        ) : (
          <AdminDashboardPaginationSummary key={token}>...</AdminDashboardPaginationSummary>
        ),
      )}
      <AdminDashboardPaginationButton
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Page suivante"
      >
        {'>'}
      </AdminDashboardPaginationButton>
    </AdminDashboardPagination>
  )
}
