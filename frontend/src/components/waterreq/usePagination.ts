import { useState, useMemo } from 'react';

interface UsePaginationProps<T> {
  data: T[];
  initialItemsPerPage?: number;
}

export const usePagination = <T>({ data, initialItemsPerPage = 25 }: UsePaginationProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // reset page
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Logic สำหรับ responsive page buttons
  const getVisiblePages = () => {
    const maxPages = window.innerWidth < 640 ? 3 : totalPages; // จอเล็ก show 3 หน้า
    const pages: number[] = [];

    const visible = Math.min(totalPages, maxPages);
    let start = Math.max(1, currentPage - Math.floor(visible / 2));
    let end = start + visible - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - visible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData,
    totalItems: data.length,
    handlePageChange,
    handleItemsPerPageChange,
    resetPagination,
    getVisiblePages, // เพิ่ม function นี้ แทนที่จะเปลี่ยน return structure
  };
};
