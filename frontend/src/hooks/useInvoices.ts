// useInvoices — Custom hook for invoice fetching, filtering, sorting, pagination
import { useState, useEffect, useCallback } from 'react';
import type { Invoice } from '@/types';
import { getInvoices, type InvoiceFilters, type PaginatedResult } from '@/services/invoiceService';

interface UseInvoicesReturn {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  // Filter controls
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedStatus: string;
  setSelectedStatus: (v: string) => void;
  selectedVendor: string;
  setSelectedVendor: (v: string) => void;
  // Sort controls
  sortField: string;
  sortOrder: 'asc' | 'desc';
  handleSort: (field: string) => void;
  // Pagination
  setPage: (p: number) => void;
  // Actions
  refresh: () => void;
}

export function useInvoices(initialPageSize = 10): UseInvoicesReturn {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Omit<PaginatedResult<Invoice>, 'data'>>({
    total: 0,
    page: 1,
    pageSize: initialPageSize,
    totalPages: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedVendor, setSelectedVendor] = useState('All Vendors');
  const [sortField, setSortField] = useState('receivedOn');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: InvoiceFilters = {
        search: searchTerm || undefined,
        status: selectedStatus,
        vendor: selectedVendor,
        page,
        pageSize: initialPageSize,
        sortField,
        sortOrder,
      };
      const result = await getInvoices(filters);
      setInvoices(result.data);
      setPagination({
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedStatus, selectedVendor, page, sortField, sortOrder, initialPageSize]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedStatus, selectedVendor]);

  const handleSort = useCallback((field: string) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortOrder('desc');
      return field;
    });
  }, []);

  return {
    invoices,
    loading,
    error,
    total: pagination.total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    selectedVendor,
    setSelectedVendor,
    sortField,
    sortOrder,
    handleSort,
    setPage,
    refresh: fetchInvoices,
  };
}
