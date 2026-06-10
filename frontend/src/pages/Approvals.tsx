import { useState } from 'react';
import {
  Search,
  Eye,
  MoreVertical,
  X,
  Edit2,
  Check,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';

type AnomalyStatus = 'Pending Review' | 'In Progress' | 'Resolved';

interface ExceptionItem {
  id: string;
  vendor: string;
  issueType: 'Missing GSTIN' | 'Amount Mismatch' | 'Vendor Not Found' | 'Duplicate Invoice';
  confidence: number;
  assignedTo: string;
  status: AnomalyStatus;
  date: string;
  amount: number;
  extractedGstin: string;
  description: string;
  extractedFields: {
    field: string;
    extractedValue: string;
    suggestedValue: string;
    isEditable?: boolean;
    isCorrected?: boolean;
  }[];
}

const mockExceptions: ExceptionItem[] = [
  {
    id: 'INV-2025-1243',
    vendor: 'Office Needs Co.',
    issueType: 'Missing GSTIN',
    confidence: 65,
    assignedTo: 'Ananya Sharma',
    status: 'Pending Review',
    date: 'May 17, 2025',
    amount: 15680.00,
    extractedGstin: 'Not Found',
    description: 'GSTIN is missing or not detected in the invoice.',
    extractedFields: [
      { field: 'Vendor Name', extractedValue: 'Office Needs Co.', suggestedValue: 'Office Needs Co.' },
      { field: 'GSTIN', extractedValue: 'Not Found', suggestedValue: '29ABCDE1234F1Z5', isEditable: true },
      { field: 'Invoice Number', extractedValue: 'INV-2025-1243', suggestedValue: 'INV-2025-1243' },
      { field: 'Invoice Date', extractedValue: 'May 17, 2025', suggestedValue: 'May 17, 2025' },
      { field: 'Total Amount', extractedValue: '₹ 15,680.00', suggestedValue: '₹ 15,680.00' },
    ],
  },
  {
    id: 'INV-2025-1239',
    vendor: 'Data Experts',
    issueType: 'Amount Mismatch',
    confidence: 72,
    assignedTo: 'Rohit Mehta',
    status: 'Pending Review',
    date: 'May 16, 2025',
    amount: 45900.00,
    extractedGstin: '29DTEXP1234A1Z0',
    description: 'Line items sum (₹ 45,000.00) does not match stated total (₹ 45,900.00).',
    extractedFields: [
      { field: 'Vendor Name', extractedValue: 'Data Experts', suggestedValue: 'Data Experts' },
      { field: 'GSTIN', extractedValue: '29DTEXP1234A1Z0', suggestedValue: '29DTEXP1234A1Z0' },
      { field: 'Invoice Number', extractedValue: 'INV-2025-1239', suggestedValue: 'INV-2025-1239' },
      { field: 'Invoice Date', extractedValue: 'May 16, 2025', suggestedValue: 'May 16, 2025' },
      { field: 'Total Amount', extractedValue: '₹ 45,900.00', suggestedValue: '₹ 45,000.00', isEditable: true },
    ],
  },
  {
    id: 'INV-2025-1228',
    vendor: 'Global Supplies',
    issueType: 'Vendor Not Found',
    confidence: 60,
    assignedTo: 'Priya Nair',
    status: 'Pending Review',
    date: 'May 15, 2025',
    amount: 89000.00,
    extractedGstin: '29GLSUP9876D1Z1',
    description: 'Vendor name extracted does not match any registered vendor in the vendor database.',
    extractedFields: [
      { field: 'Vendor Name', extractedValue: 'Global Supplies', suggestedValue: 'Global Supplies LLC', isEditable: true },
      { field: 'GSTIN', extractedValue: '29GLSUP9876D1Z1', suggestedValue: '29GLSUP9876D1Z1' },
      { field: 'Invoice Number', extractedValue: 'INV-2025-1228', suggestedValue: 'INV-2025-1228' },
      { field: 'Invoice Date', extractedValue: 'May 15, 2025', suggestedValue: 'May 15, 2025' },
      { field: 'Total Amount', extractedValue: '₹ 89,000.00', suggestedValue: '₹ 89,000.00' },
    ],
  },
  {
    id: 'INV-2025-1207',
    vendor: 'TechCorp India',
    issueType: 'Duplicate Invoice',
    confidence: 85,
    assignedTo: 'Rohit Mehta',
    status: 'In Progress',
    date: 'May 14, 2025',
    amount: 142190.00,
    extractedGstin: '29AAECT1234F1Z5',
    description: 'An invoice with the same vendor, number, and amount was already processed on May 12, 2025.',
    extractedFields: [
      { field: 'Vendor Name', extractedValue: 'TechCorp India', suggestedValue: 'TechCorp India' },
      { field: 'GSTIN', extractedValue: '29AAECT1234F1Z5', suggestedValue: '29AAECT1234F1Z5' },
      { field: 'Invoice Number', extractedValue: 'INV-2025-1207', suggestedValue: 'INV-2025-1207' },
      { field: 'Invoice Date', extractedValue: 'May 14, 2025', suggestedValue: 'May 14, 2025' },
      { field: 'Total Amount', extractedValue: '₹ 1,42,190.00', suggestedValue: '₹ 1,42,190.00' },
    ],
  },
  {
    id: 'INV-2025-1198',
    vendor: 'ABC Solutions Ltd.',
    issueType: 'Missing GSTIN',
    confidence: 68,
    assignedTo: 'Ananya Sharma',
    status: 'In Progress',
    date: 'May 13, 2025',
    amount: 120500.00,
    extractedGstin: 'Not Found',
    description: 'GSTIN is missing or not detected in the invoice.',
    extractedFields: [
      { field: 'Vendor Name', extractedValue: 'ABC Solutions Ltd.', suggestedValue: 'ABC Solutions Ltd.' },
      { field: 'GSTIN', extractedValue: 'Not Found', suggestedValue: '29ABCDE1234F1Z5', isEditable: true },
      { field: 'Invoice Number', extractedValue: 'INV-2025-1198', suggestedValue: 'INV-2025-1198' },
      { field: 'Invoice Date', extractedValue: 'May 13, 2025', suggestedValue: 'May 13, 2025' },
      { field: 'Total Amount', extractedValue: '₹ 1,20,500.00', suggestedValue: '₹ 1,20,500.00' },
    ],
  },
  {
    id: 'INV-2025-1186',
    vendor: 'Office Needs Co.',
    issueType: 'Amount Mismatch',
    confidence: 75,
    assignedTo: 'Priya Nair',
    status: 'Pending Review',
    date: 'May 12, 2025',
    amount: 8400.00,
    extractedGstin: '29ABCDE1234F1Z5',
    description: 'Line items sum (₹ 8,000.00) does not match total amount (₹ 8,400.00).',
    extractedFields: [
      { field: 'Vendor Name', extractedValue: 'Office Needs Co.', suggestedValue: 'Office Needs Co.' },
      { field: 'GSTIN', extractedValue: '29ABCDE1234F1Z5', suggestedValue: '29ABCDE1234F1Z5' },
      { field: 'Invoice Number', extractedValue: 'INV-2025-1186', suggestedValue: 'INV-2025-1186' },
      { field: 'Invoice Date', extractedValue: 'May 12, 2025', suggestedValue: 'May 12, 2025' },
      { field: 'Total Amount', extractedValue: '₹ 8,400.00', suggestedValue: '₹ 8,000.00', isEditable: true },
    ],
  },
  {
    id: 'INV-2025-1175',
    vendor: 'Info Systems',
    issueType: 'Vendor Not Found',
    confidence: 55,
    assignedTo: 'Ananya Sharma',
    status: 'Pending Review',
    date: 'May 11, 2025',
    amount: 32000.00,
    extractedGstin: '29INFSY1234A1Z2',
    description: 'Vendor name extracted does not match any registered vendor in the vendor database.',
    extractedFields: [
      { field: 'Vendor Name', extractedValue: 'Info Systems', suggestedValue: 'Info Systems India', isEditable: true },
      { field: 'GSTIN', extractedValue: '29INFSY1234A1Z2', suggestedValue: '29INFSY1234A1Z2' },
      { field: 'Invoice Number', extractedValue: 'INV-2025-1175', suggestedValue: 'INV-2025-1175' },
      { field: 'Invoice Date', extractedValue: 'May 11, 2025', suggestedValue: 'May 11, 2025' },
      { field: 'Total Amount', extractedValue: '₹ 32,000.00', suggestedValue: '₹ 32,000.00' },
    ],
  },
  {
    id: 'INV-2025-1162',
    vendor: 'Digital Services',
    issueType: 'Missing GSTIN',
    confidence: 70,
    assignedTo: 'Rohit Mehta',
    status: 'Resolved',
    date: 'May 10, 2025',
    amount: 14500.00,
    extractedGstin: '29DIGSR5544B1Z9',
    description: 'GSTIN is missing or not detected in the invoice.',
    extractedFields: [
      { field: 'Vendor Name', extractedValue: 'Digital Services', suggestedValue: 'Digital Services' },
      { field: 'GSTIN', extractedValue: 'Not Found', suggestedValue: '29DIGSR5544B1Z9', isCorrected: true },
      { field: 'Invoice Number', extractedValue: 'INV-2025-1162', suggestedValue: 'INV-2025-1162' },
      { field: 'Invoice Date', extractedValue: 'May 10, 2025', suggestedValue: 'May 10, 2025' },
      { field: 'Total Amount', extractedValue: '₹ 14,500.00', suggestedValue: '₹ 14,500.00' },
    ],
  },
];

export default function Approvals() {
  const [exceptions, setExceptions] = useState<ExceptionItem[]>(mockExceptions);
  const [selectedId, setSelectedId] = useState<string>('INV-2025-1243');
  const [searchText, setSearchText] = useState('');
  const [issueFilter, setIssueFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Pending Review');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [commentText, setCommentText] = useState('');
  
  // Custom suggestion overrides editable value
  const [editableValues, setEditableValues] = useState<Record<string, string>>({
    'INV-2025-1243-GSTIN': '29ABCDE1234F1Z5',
    'INV-2025-1239-Total Amount': '₹ 45,000.00',
    'INV-2025-1228-Vendor Name': 'Global Supplies LLC',
    'INV-2025-1198-GSTIN': '29ABCDE1234F1Z5',
    'INV-2025-1186-Total Amount': '₹ 8,000.00',
    'INV-2025-1175-Vendor Name': 'Info Systems India',
  });

  const selectedItem = exceptions.find((x) => x.id === selectedId);

  // Stats computation
  const totalCount = 70; // Mocked total
  const pendingCount = exceptions.filter((x) => x.status === 'Pending Review').length;
  const inProgressCount = exceptions.filter((x) => x.status === 'In Progress').length;
  const resolvedCount = exceptions.filter((x) => x.status === 'Resolved').length;

  const handleEditChange = (key: string, val: string) => {
    setEditableValues((prev) => ({ ...prev, [key]: val }));
  };

  const updateStatus = (status: AnomalyStatus) => {
    if (!selectedItem) return;
    setExceptions((prev) =>
      prev.map((x) =>
        x.id === selectedItem.id
          ? {
              ...x,
              status,
              // mark editable fields as corrected
              extractedFields: x.extractedFields.map((f) =>
                f.isEditable ? { ...f, isCorrected: true } : f
              ),
            }
          : x
      )
    );
    setCommentText('');
  };

  const getIssueBadgeColor = (type: ExceptionItem['issueType']) => {
    switch (type) {
      case 'Missing GSTIN':
        return 'bg-red-50 text-red-700 border-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      case 'Amount Mismatch':
        return 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'Vendor Not Found':
        return 'bg-red-50 text-red-700 border-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      case 'Duplicate Invoice':
        return 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
    }
  };

  const getConfidenceStyle = (confidence: number) => {
    if (confidence >= 80) return 'text-emerald-500 font-semibold';
    if (confidence >= 70) return 'text-amber-500 font-semibold';
    return 'text-red-500 font-semibold';
  };

  // Filter lists logic
  const filteredExceptions = exceptions.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchText.toLowerCase()) ||
      item.vendor.toLowerCase().includes(searchText.toLowerCase()) ||
      item.issueType.toLowerCase().includes(searchText.toLowerCase());
    const matchesIssue = issueFilter === 'All' || item.issueType === issueFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesAssignee = assigneeFilter === 'All' || item.assignedTo === assigneeFilter;
    return matchesSearch && matchesIssue && matchesStatus && matchesAssignee;
  });

  return (
    <div className="min-h-screen pb-12">
      {/* Header Info */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Approval / Exception Review
        </h1>
        <p className="text-sm text-muted-foreground mt-1 select-none">
          Review and resolve exceptions in AI-processed invoices.
        </p>
      </div>

      {/* Row 1: Exception Statistics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border border-border">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Total Exceptions
              </span>
              <span className="text-2xl font-bold text-foreground block mt-0.5">
                {totalCount}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium block">
                100% of total
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Pending Review
              </span>
              <span className="text-2xl font-bold text-foreground block mt-0.5">
                {pendingCount}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium block">
                {((pendingCount / totalCount) * 100).toFixed(1)}% of exceptions
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
              <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin-slow" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                In Progress
              </span>
              <span className="text-2xl font-bold text-foreground block mt-0.5">
                {inProgressCount}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium block">
                {((inProgressCount / totalCount) * 100).toFixed(1)}% of exceptions
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Resolved
              </span>
              <span className="text-2xl font-bold text-foreground block mt-0.5">
                {resolvedCount}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium block">
                {((resolvedCount / totalCount) * 100).toFixed(1)}% of exceptions
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Search & Filter bar controls */}
      <Card className="border border-border mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 flex-col md:flex-row gap-3 w-full">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by invoice ID, vendor, or issue..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9 h-9 w-full bg-background border border-input rounded-md text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            {/* Issue Filter */}
            <div className="w-full md:w-40 relative">
              <select
                value={issueFilter}
                onChange={(e) => setIssueFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer pr-8"
              >
                <option value="All">Issue Type: All</option>
                <option value="Missing GSTIN">Missing GSTIN</option>
                <option value="Amount Mismatch">Amount Mismatch</option>
                <option value="Vendor Not Found">Vendor Not Found</option>
                <option value="Duplicate Invoice">Duplicate Invoice</option>
              </select>
              <ChevronDown className="w-4.5 h-4.5 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-44 relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer pr-8"
              >
                <option value="All">Status: All</option>
                <option value="Pending Review">Pending Review</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
              <ChevronDown className="w-4.5 h-4.5 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Assigned To Filter */}
            <div className="w-full md:w-40 relative">
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer pr-8"
              >
                <option value="All">Assigned: All</option>
                <option value="Ananya Sharma">Ananya Sharma</option>
                <option value="Rohit Mehta">Rohit Mehta</option>
                <option value="Priya Nair">Priya Nair</option>
              </select>
              <ChevronDown className="w-4.5 h-4.5 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs flex-1 md:flex-initial">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-1 text-xs flex-1 md:flex-initial">
              Bulk Actions
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Row 3: Split Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_450px] gap-6">
        {/* Left Column Exception Table */}
        <Card className="border border-border shadow-sm h-fit">
          <CardHeader className="pb-3 border-b border-border bg-muted/5 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold font-heading select-none">
              Exceptions ({filteredExceptions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/10 font-semibold text-muted-foreground uppercase select-none">
                    <th className="py-3 px-3 w-8">
                      <input type="checkbox" className="rounded border-input text-primary focus:ring-primary" />
                    </th>
                    <th className="py-3 px-3">Invoice ID</th>
                    <th className="py-3 px-3">Vendor</th>
                    <th className="py-3 px-3">Issue Type</th>
                    <th className="py-3 px-3">Confidence</th>
                    <th className="py-3 px-3">Assigned To</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredExceptions.map((item) => {
                    const isSelected = item.id === selectedId;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`cursor-pointer transition-colors duration-150 ${
                          isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-accent/20'
                        }`}
                      >
                        <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => setSelectedId(item.id)}
                            className="rounded border-input text-primary focus:ring-primary"
                          />
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-primary">{item.id}</td>
                        <td className="py-3.5 px-3 font-medium text-foreground">{item.vendor}</td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getIssueBadgeColor(
                              item.issueType
                            )}`}
                          >
                            {item.issueType}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={getConfidenceStyle(item.confidence)}>{item.confidence}%</span>
                        </td>
                        <td className="py-3.5 px-3 text-muted-foreground">{item.assignedTo}</td>
                        <td className="py-3.5 px-3">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedId(item.id)}
                              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredExceptions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        No exceptions match your active filter configuration.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination footer */}
            <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/5 select-none text-xs">
              <span className="text-muted-foreground">
                Showing 1 to {filteredExceptions.length} of {filteredExceptions.length} results
              </span>
              <div className="flex items-center gap-1.5 font-medium">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled>
                  &lt;
                </Button>
                <Button variant="default" size="sm" className="h-7 w-7 p-0 bg-primary text-white">
                  1
                </Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled>
                  &gt;
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column Details Review Panel */}
        <div className="h-fit">
          {selectedItem ? (
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border bg-muted/5 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-foreground">{selectedItem.id}</CardTitle>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getIssueBadgeColor(
                        selectedItem.issueType
                      )}`}
                    >
                      {selectedItem.issueType}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold block text-amber-500 mt-1 select-none">
                    {selectedItem.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedId('')}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                {/* Details layout */}
                <div className="grid grid-cols-2 gap-3.5 pb-3 border-b border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Vendor</span>
                    <span className="font-semibold text-foreground">{selectedItem.vendor}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Extracted GSTIN</span>
                    <span
                      className={`font-mono font-medium ${
                        selectedItem.extractedGstin === 'Not Found' ? 'text-red-500' : 'text-foreground'
                      }`}
                    >
                      {selectedItem.extractedGstin}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Invoice Date</span>
                    <span className="font-medium text-foreground">{selectedItem.date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">AI Confidence</span>
                    <span className={getConfidenceStyle(selectedItem.confidence)}>{selectedItem.confidence}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Invoice Amount</span>
                    <span className="font-semibold text-foreground">
                      ₹ {selectedItem.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Assigned To</span>
                    <span className="font-medium text-foreground">{selectedItem.assignedTo}</span>
                  </div>
                </div>

                {/* Issue Description */}
                <div className="space-y-1">
                  <h4 className="font-bold text-foreground">Issue Description</h4>
                  <p className="text-muted-foreground bg-muted/40 p-2.5 rounded border border-border/60 leading-relaxed text-[11px]">
                    {selectedItem.description}
                  </p>
                </div>

                {/* Extracted Data Correction Panel */}
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">Extracted Data</h4>
                  <div className="border border-border rounded overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-muted/10 border-b border-border font-semibold text-muted-foreground uppercase">
                          <th className="py-2 px-2.5">Field</th>
                          <th className="py-2 px-2.5">Extracted Value</th>
                          <th className="py-2 px-2.5">Suggested / Correct Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedItem.extractedFields.map((f, idx) => {
                          const stateKey = `${selectedItem.id}-${f.field}`;
                          const isCustomEditable = f.isEditable;
                          const currentVal = editableValues[stateKey] || f.suggestedValue;
                          const isCorrected = f.isCorrected;

                          return (
                            <tr key={idx} className="hover:bg-accent/10 transition-colors">
                              <td className="py-2.5 px-2.5 text-muted-foreground font-medium">{f.field}</td>
                              <td
                                className={`py-2.5 px-2.5 font-medium ${
                                  f.extractedValue === 'Not Found' ? 'text-red-500' : 'text-foreground'
                                }`}
                              >
                                {f.extractedValue}
                              </td>
                              <td className="py-2.5 px-2.5">
                                {isCustomEditable && selectedItem.status !== 'Resolved' ? (
                                  <div className="flex items-center gap-1.5 relative">
                                    <input
                                      type="text"
                                      value={currentVal}
                                      onChange={(e) => handleEditChange(stateKey, e.target.value)}
                                      className="h-7 w-full border border-primary/50 bg-primary/5 font-semibold text-primary px-2 rounded focus:outline-none focus:ring-1 focus:ring-primary text-[11px]"
                                    />
                                    <Edit2 className="w-3 h-3 text-primary absolute right-2" />
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-semibold text-foreground">{currentVal}</span>
                                    {isCorrected || selectedItem.status === 'Resolved' ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-500 font-bold" />
                                    ) : (
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Comments box */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-foreground">Comments</h4>
                  <textarea
                    rows={3}
                    placeholder="Add comments (optional)..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full rounded border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 select-none">
                  <Button
                    variant="outline"
                    onClick={() => updateStatus('In Progress')}
                    className="flex-1 h-9 gap-1 text-xs border border-border"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                    Reprocess
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateStatus('Pending Review')}
                    className="flex-1 h-9 gap-1 text-xs text-red-500 border border-red-200/50 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => updateStatus('Resolved')}
                    className="flex-1 h-9 gap-1 text-xs bg-primary text-white hover:bg-primary/95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-border border-dashed p-8 text-center text-muted-foreground text-xs">
              Select an exception from the list to review and update values.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
