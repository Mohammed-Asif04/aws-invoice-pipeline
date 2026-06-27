import { useState } from 'react';
import { Eye, MoreVertical, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import type { Invoice } from '@/types';
import { Button } from '@/components/ui/button';

interface InvoiceTableProps {
  invoices: Invoice[];
  onViewDetails: (invoiceId: string) => void;
}

type SortField = 'invoiceId' | 'vendorName' | 'invoiceDate' | 'totalAmount' | 'status' | 'receivedOn';
type SortOrder = 'asc' | 'desc';

export default function InvoiceTable({ invoices, onViewDetails }: InvoiceTableProps) {
  const [sortField, setSortField] = useState<SortField>('receivedOn');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Handle Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Sort Logic
  const sortedInvoices = [...invoices].sort((a, b) => {
    let aVal: any = a[sortField as keyof Invoice];
    let bVal: any = b[sortField as keyof Invoice];

    if (sortField === 'invoiceDate' || sortField === 'receivedOn') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    } else if (sortField === 'totalAmount') {
      aVal = a.totalAmount;
      bVal = b.totalAmount;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination Logic
  const totalItems = sortedInvoices.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedInvoices.slice(indexOfFirstItem, indexOfLastItem);

  const formatAmount = (amount?: number, currency?: string) => {
    if (amount === undefined || amount === null) return '-';
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr || dateStr === 'PENDING') return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr || dateStr === 'PENDING') return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date} ${time}`;
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {/* Table container */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground select-none">
              <th className="py-3.5 px-4 cursor-pointer hover:bg-muted/45 transition-colors" onClick={() => handleSort('invoiceId')}>
                <div className="flex items-center gap-1">
                  Invoice ID <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:bg-muted/45 transition-colors" onClick={() => handleSort('vendorName')}>
                <div className="flex items-center gap-1">
                  Vendor <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:bg-muted/45 transition-colors" onClick={() => handleSort('invoiceDate')}>
                <div className="flex items-center gap-1">
                  Invoice Date <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:bg-muted/45 transition-colors" onClick={() => handleSort('totalAmount')}>
                <div className="flex items-center gap-1">
                  Amount <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:bg-muted/45 transition-colors" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">
                  Status <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:bg-muted/45 transition-colors" onClick={() => handleSort('receivedOn')}>
                <div className="flex items-center gap-1">
                  Received On <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {currentItems.map((invoice) => (
              <tr key={invoice.invoiceId} className="hover:bg-accent/30 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-primary">
                  <button
                    onClick={() => onViewDetails(invoice.invoiceId)}
                    className="hover:underline text-left outline-none"
                  >
                    {invoice.invoiceId}
                  </button>
                </td>
                <td className="py-3.5 px-4 font-medium text-foreground">{invoice.vendorName}</td>
                <td className="py-3.5 px-4 text-muted-foreground">{formatDate(invoice.invoiceDate)}</td>
                <td className="py-3.5 px-4 font-semibold text-foreground">
                  {formatAmount(invoice.totalAmount, invoice.currency)}
                </td>
                <td className="py-3.5 px-4">
                  <StatusBadge status={invoice.status} />
                </td>
                <td className="py-3.5 px-4 text-muted-foreground text-xs">
                  {formatDateTime(invoice.receivedOn)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onViewDetails(invoice.invoiceId)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-border bg-card">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
          <span className="font-medium">{Math.min(indexOfLastItem, totalItems)}</span> of{' '}
          <span className="font-medium">{totalItems}</span> results
        </p>
        
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant={currentPage === 1 ? 'default' : 'outline'}
            size="xs"
            onClick={() => setCurrentPage(1)}
            className={currentPage === 1 ? 'bg-primary text-primary-foreground font-semibold' : 'border-border'}
          >
            1
          </Button>

          {totalPages >= 2 && (
            <Button
              variant={currentPage === 2 ? 'default' : 'outline'}
              size="xs"
              onClick={() => setCurrentPage(2)}
              className={currentPage === 2 ? 'bg-primary text-primary-foreground font-semibold' : 'border-border'}
            >
              2
            </Button>
          )}

          {totalPages >= 3 && (
            <Button
              variant={currentPage === 3 ? 'default' : 'outline'}
              size="xs"
              onClick={() => setCurrentPage(3)}
              className={currentPage === 3 ? 'bg-primary text-primary-foreground font-semibold' : 'border-border'}
            >
              3
            </Button>
          )}

          {totalPages > 4 && <span className="text-muted-foreground px-1 text-xs">...</span>}

          {totalPages > 3 && (
            <Button
              variant={currentPage === totalPages ? 'default' : 'outline'}
              size="xs"
              onClick={() => setCurrentPage(totalPages)}
              className={currentPage === totalPages ? 'bg-primary text-primary-foreground font-semibold' : 'border-border'}
            >
              {totalPages}
            </Button>
          )}

          <Button
            variant="outline"
            size="icon-sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
