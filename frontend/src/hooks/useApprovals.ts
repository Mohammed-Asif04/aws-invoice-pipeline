// useApprovals — Custom hook for exception review workflow
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getExceptions,
  approveException,
  rejectException,
  reprocessException,
  getExceptionStats,
  type ExceptionItem,
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
  const [allExceptions, setAllExceptions] = useState<ExceptionItem[]>([]);
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
      const data = await getExceptions({});
      setAllExceptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exceptions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExceptions();
  }, [fetchExceptions]);

  // Apply filters locally on allExceptions
  const exceptions = useMemo(() => {
    return allExceptions.filter((item) => {
      const matchesSearch = !searchText ||
        item.id.toLowerCase().includes(searchText.toLowerCase()) ||
        item.vendor.toLowerCase().includes(searchText.toLowerCase()) ||
        item.issueType.toLowerCase().includes(searchText.toLowerCase());
      const matchesIssue = !issueFilter || issueFilter === 'All' || item.issueType === issueFilter;
      const matchesStatus = !statusFilter || statusFilter === 'All' || item.status === statusFilter;
      const matchesAssignee = !assigneeFilter || assigneeFilter === 'All' || item.assignedTo === assigneeFilter;
      return matchesSearch && matchesIssue && matchesStatus && matchesAssignee;
    });
  }, [allExceptions, searchText, issueFilter, statusFilter, assigneeFilter]);

  // Auto-select first item in the filtered exceptions list if none selected or currently selected is filtered out
  useEffect(() => {
    if (exceptions.length > 0) {
      const exists = exceptions.some((x) => x.id === selectedId);
      if (!exists) {
        setSelectedId(exceptions[0].id);
      }
    } else {
      setSelectedId('');
    }
  }, [exceptions, selectedId]);

  const selectedItem = useMemo(() => {
    return allExceptions.find((x) => x.id === selectedId);
  }, [allExceptions, selectedId]);

  const stats = useMemo(() => {
    return getExceptionStats(allExceptions);
  }, [allExceptions]);

  const handleEditChange = useCallback((key: string, val: string) => {
    setEditableValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const updateLocalStatus = useCallback((status: AnomalyStatus) => {
    if (!selectedId) return;
    setAllExceptions((prev) =>
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
      // Filter editableValues to only include corrections belonging to the selectedId
      const filteredValues = Object.entries(editableValues)
        .filter(([key]) => key.startsWith(`${selectedId}-`))
        .reduce<Record<string, string>>((acc, [key, val]) => {
          acc[key] = val;
          return acc;
        }, {});

      await approveException(selectedId, filteredValues, comment || commentText);
      updateLocalStatus('Resolved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    }
  }, [selectedId, editableValues, commentText, updateLocalStatus]);

  const handleReject = useCallback(async (reason?: string) => {
    if (!selectedId) return;
    try {
      await rejectException(selectedId, reason || commentText);
      updateLocalStatus('Resolved');
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
