'use client';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useRouter } from 'next/navigation';
import { buildPageNumbers, cn, ELLIPSIS } from '@/lib/utils';

const CoinsPagination = ({ currentPage, totalPages, hasMorePages }: Pagination) => {
  const router = useRouter();

  const handlePageChange = (page: number) => {
    router.push(`/coins?page=${page}`);
  };

  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const isLastPage = !hasMorePages || currentPage === totalPages;
  const canGoPrev = currentPage > 1;
  const canGoNext = !isLastPage;

  return (
    <Pagination id="coins-pagination">
      <PaginationContent className="pagination-content">
        <PaginationItem className="pagination-control prev">
          <PaginationPrevious
            href={canGoPrev ? `/coins?page=${currentPage - 1}` : undefined}
            aria-disabled={!canGoPrev}
            tabIndex={canGoPrev ? undefined : -1}
            onClick={(event) => {
              if (!canGoPrev) {
                event.preventDefault();
                return;
              }
              handlePageChange(currentPage - 1);
            }}
            className={canGoPrev ? 'control-button' : 'control-disabled'}
          />
        </PaginationItem>

        <div className="pagination-pages">
          {pageNumbers.map((page, index) => (
            <PaginationItem key={index}>
              {page === ELLIPSIS ? (
                <span className="ellipsis">...</span>
              ) : (
                <PaginationLink
                  href={`/coins?page=${page}`}
                  onClick={() => handlePageChange(page)}
                  className={cn('page-link', {
                    'page-link-active': currentPage === page,
                  })}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
        </div>

        <PaginationItem className="pagination-control next">
          <PaginationNext
            href={canGoNext ? `/coins?page=${currentPage + 1}` : undefined}
            aria-disabled={!canGoNext}
            tabIndex={canGoNext ? undefined : -1}
            onClick={(event) => {
              if (!canGoNext) {
                event.preventDefault();
                return;
              }
              handlePageChange(currentPage + 1);
            }}
            className={canGoNext ? 'control-button' : 'control-disabled'}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default CoinsPagination;