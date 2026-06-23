// useApprovals — Custom hook for exception review workflow
import { useState, useEffect, useCallback } from 'react';
import {
  getExceptions,
  approveException,
  rejectException,
  reprocessException,
  getExceptionStats,
  type ExceptionItem,
  type ExceptionFilters,
  type AnomalyStatus,
} from '@/services/approvalService';

interface UseApprovalsReturn {
  exceptions: ExceptionItem[];
  loading: boolean;
  error: string | null;
  // Stats
  stats: { total: number; pending: number; inProgress: number; resolved: number };
  // Selected item
  selectedId: string;
  setSelectedId: (id: string) => void;
  selectedItem: ExceptionItem | undefined;
  // Filters
  searchText: string;
  setSearchText: (v: string) => void;
  issueFilter: string;
  setIssueFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (v: string) => void;
  // Actions
  handleApprove: (comment?: string) => Promise<void>;
  handleReject: (reason?: string) => Promise<void>;
  handleReprocess: () => Promise<void>;
  updateLocalStatus: (status: AnomalyStatus) => void;
  // Editable values
  editableValues: Record<string, string>;
  handleEditChange: (key: string, val: string) => void;
  // Comment
  commentText: string;
  setCommentText: (v: string) => void;
  // Refresh
  refresh: () => void;
}

export function useApprovals(): UseApprovalsReturn {
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [commentText, setCommentText] = useState('');

  // Filters
  const [searchText, setSearchText] = useState('');
  const [issueFilter, setIssueFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Pending Review');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  // Editable field overrides
  const [editableValues, setEditableValues] = useState<Record<string, string>>({
    'INV-2025-1243-GSTIN': '29ABCDE1234F1Z5',
    'INV-2025-1239-Total Amount': '₹ 45,000.00',
    'INV-2025-1228-Vendor Name': 'Global Supplies LLC',
    'INV-2025-1198-GSTIN': '29ABCDE1234F1Z5',
    'INV-2025-1186-Total Amount': '₹ 8,000.00',
    'INV-2025-1175-Vendor Name': 'Info Systems India',
  });

  const fetchExceptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: ExceptionFilters = {
        search: searchText || undefined,
        issueType: issueFilter,
        status: statusFilter,
        assignedTo: assigneeFilter,
      };
      const data = await getExceptions(filters);
      setExceptions(data);
      // Auto-select first item if nothing selected
      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exceptions');
    } finally {
      setLoading(false);
    }
  }, [searchText, issueFilter, statusFilter, assigneeFilter, selectedId]);

  useEffect(() => {
    fetchExceptions();
  }, [fetchExceptions]);

  const selectedItem = exceptions.find((x) => x.id === selectedId);
  const stats = getExceptionStats(exceptions);

  const handleEditChange = useCallback((key: string, val: string) => {
    setEditableValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const updateLocalStatus = useCallback((status: AnomalyStatus) => {
    if (!selectedId) return;
    setExceptions((prev) =>
      prev.map((x) =>
        x.id === selectedId
          ? {
              ...x,
              status,
              extractedFields: x.extractedFields.map((f) =>
                f.isEditable ? { ...f, isCorrected: true } : f
              ),
            }
          : x
      )
    );
    setCommentText('');
  }, [selectedId]);

  const handleApprove = useCallback(async (comment?: string) => {
    if (!selectedId) return;
    try {
      await approveException(selectedId, editableValues, comment || commentText);
      updateLocalStatus('Resolved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    }
  }, [selectedId, editableValues, commentText, updateLocalStatus]);

  const handleReject = useCallback(async (reason?: string) => {
    if (!selectedId) return;
    try {
      await rejectException(selectedId, reason || commentText);
      updateLocalStatus('Pending Review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rejection failed');
    }
  }, [selectedId, commentText, updateLocalStatus]);

  const handleReprocess = useCallback(async () => {
    if (!selectedId) return;
    try {
      await reprocessException(selectedId);
      updateLocalStatus('In Progress');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reprocess failed');
    }
  }, [selectedId, updateLocalStatus]);

  return {
    exceptions,
    loading,
    error,
    stats,
    selectedId,
    setSelectedId,
    selectedItem,
    searchText,
    setSearchText,
    issueFilter,
    setIssueFilter,
    statusFilter,
    setStatusFilter,
    assigneeFilter,
    setAssigneeFilter,
    handleApprove,
    handleReject,
    handleReprocess,
    updateLocalStatus,
    editableValues,
    handleEditChange,
    commentText,
    setCommentText,
    refresh: fetchExceptions,
  };
}
