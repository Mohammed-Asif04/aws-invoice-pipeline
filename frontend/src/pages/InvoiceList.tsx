import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import InvoiceTable from '@/components/InvoiceTable';
import { useInvoices } from '@/hooks/useInvoices';
import { useNavigate } from 'react-router-dom';

export default function InvoiceList() {
  const navigate = useNavigate();
  const {
    invoices,
    loading,
    error,
    setSearchTerm,
    setSelectedStatus,
    setSelectedVendor,
  } = useInvoices(100); // Fetch up to 100 invoices to let the InvoiceTable do its client-side sorting/pagination

  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(invoices, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `invoices_export_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleViewDetails = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`);
  };

  return (
    <div className="min-h-screen pb-12">
      <Header
        title="Invoices"
        subtitle="View and manage all invoices in the system."
      />

      <FilterBar
        onSearchChange={setSearchTerm}
        onStatusChange={setSelectedStatus}
        onVendorChange={setSelectedVendor}
        onDateRangeChange={() => {}}
        onExport={handleExport}
      />

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 max-w-2xl mx-auto my-8">
          Error loading invoices: {error}
        </div>
      ) : (
        <InvoiceTable
          invoices={invoices}
          onViewDetails={handleViewDetails}
        />
      )}
    </div>
  );
}

