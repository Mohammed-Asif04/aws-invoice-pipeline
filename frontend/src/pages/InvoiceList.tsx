import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import InvoiceTable from '@/components/InvoiceTable';
import type { Invoice, InvoiceStatus } from '@/types';
import { useNavigate } from 'react-router-dom';

const mockInvoicesRaw = [
  {
    invoiceId: 'INV-2025-1246',
    vendorName: 'ABC Solutions Ltd.',
    invoiceDate: '2025-05-18',
    totalAmount: 124500.00,
    currency: 'INR',
    status: 'Processed',
    receivedOn: '2025-05-18T10:23:00Z',
    extractionConfidence: 98,
    lineItems: [],
    subtotal: 105508.47,
    cgst: 9495.76,
    sgst: 9495.76,
    anomalies: [],
    createdAt: '2025-05-18T10:23:00Z',
  },
  {
    invoiceId: 'INV-2025-1245',
    vendorName: 'TechCorp India',
    invoiceDate: '2025-05-18',
    totalAmount: 98750.00,
    currency: 'INR',
    status: 'In Review',
    receivedOn: '2025-05-18T09:15:00Z',
    extractionConfidence: 89,
    lineItems: [],
    subtotal: 83686.44,
    cgst: 7531.78,
    sgst: 7531.78,
    anomalies: [],
    createdAt: '2025-05-18T09:15:00Z',
  },
  {
    invoiceId: 'INV-2025-1244',
    vendorName: 'Global Supplies',
    invoiceDate: '2025-05-18',
    totalAmount: 245000.00,
    currency: 'INR',
    status: 'Processed',
    receivedOn: '2025-05-18T08:42:00Z',
    extractionConfidence: 96,
    lineItems: [],
    subtotal: 207627.12,
    cgst: 18686.44,
    sgst: 18686.44,
    anomalies: [],
    createdAt: '2025-05-18T08:42:00Z',
  },
  {
    invoiceId: 'INV-2025-1243',
    vendorName: 'Office Needs Co.',
    invoiceDate: '2025-05-17',
    totalAmount: 15680.00,
    currency: 'INR',
    status: 'Exception',
    receivedOn: '2025-05-17T18:31:00Z',
    extractionConfidence: 78,
    lineItems: [],
    subtotal: 13288.14,
    cgst: 1195.93,
    sgst: 1195.93,
    anomalies: [
      { type: 'Missing GSTIN', description: 'Vendor GSTIN is missing in document', severity: 'HIGH' },
    ],
    createdAt: '2025-05-17T18:31:00Z',
  },
  {
    invoiceId: 'INV-2025-1242',
    vendorName: 'Digital Services',
    invoiceDate: '2025-05-17',
    totalAmount: 75000.00,
    currency: 'INR',
    status: 'Processed',
    receivedOn: '2025-05-17T17:12:00Z',
    extractionConfidence: 95,
    lineItems: [],
    subtotal: 63559.32,
    cgst: 5720.34,
    sgst: 5720.34,
    anomalies: [],
    createdAt: '2025-05-17T17:12:00Z',
  },
  {
    invoiceId: 'INV-2025-1241',
    vendorName: 'BufferOn Pvt. Ltd.',
    invoiceDate: '2025-05-17',
    totalAmount: 110000.00,
    currency: 'INR',
    status: 'In Review',
    receivedOn: '2025-05-17T16:05:00Z',
    extractionConfidence: 91,
    lineItems: [],
    subtotal: 93220.34,
    cgst: 8389.83,
    sgst: 8389.83,
    anomalies: [],
    createdAt: '2025-05-17T16:05:00Z',
  },
  {
    invoiceId: 'INV-2025-1240',
    vendorName: 'Info Systems',
    invoiceDate: '2025-05-16',
    totalAmount: 18600.00,
    currency: 'INR',
    status: 'Processed',
    receivedOn: '2025-05-16T15:20:00Z',
    extractionConfidence: 97,
    lineItems: [],
    subtotal: 15762.71,
    cgst: 1418.64,
    sgst: 1418.64,
    anomalies: [],
    createdAt: '2025-05-16T15:20:00Z',
  },
  {
    invoiceId: 'INV-2025-1239',
    vendorName: 'Data Experts',
    invoiceDate: '2025-05-16',
    totalAmount: 56000.00,
    currency: 'INR',
    status: 'Exception',
    receivedOn: '2025-05-16T14:11:00Z',
    extractionConfidence: 74,
    lineItems: [],
    subtotal: 47457.63,
    cgst: 4271.19,
    sgst: 4271.19,
    anomalies: [
      { type: 'Amount Mismatch', description: 'Calculated line items total does not match final total', severity: 'HIGH' },
    ],
    createdAt: '2025-05-16T14:11:00Z',
  },
  {
    invoiceId: 'INV-2025-1238',
    vendorName: 'Office Needs Co.',
    invoiceDate: '2025-05-16',
    totalAmount: 32450.00,
    currency: 'INR',
    status: 'Processed',
    receivedOn: '2025-05-16T13:43:00Z',
    extractionConfidence: 94,
    lineItems: [],
    subtotal: 27500.00,
    cgst: 2475.00,
    sgst: 2475.00,
    anomalies: [],
    createdAt: '2025-05-16T13:43:00Z',
  },
  {
    invoiceId: 'INV-2025-1237',
    vendorName: 'ABC Solutions Ltd.',
    invoiceDate: '2025-05-15',
    totalAmount: 85000.00,
    currency: 'INR',
    status: 'Processed',
    receivedOn: '2025-05-15T11:20:00Z',
    extractionConfidence: 97,
    lineItems: [],
    subtotal: 72033.90,
    cgst: 6483.05,
    sgst: 6483.05,
    anomalies: [],
    createdAt: '2025-05-15T11:20:00Z',
  },
  // Extra pages for pagination
  {
    invoiceId: 'INV-2025-1236',
    vendorName: 'BufferOn Pvt. Ltd.',
    invoiceDate: '2025-05-15',
    totalAmount: 45000.00,
    currency: 'INR',
    status: 'Processed',
    receivedOn: '2025-05-15T10:02:00Z',
    extractionConfidence: 95,
    lineItems: [],
    subtotal: 38135.59,
    cgst: 3432.20,
    sgst: 3432.20,
    anomalies: [],
    createdAt: '2025-05-15T10:02:00Z',
  },
  {
    invoiceId: 'INV-2025-1235',
    vendorName: 'Digital Services',
    invoiceDate: '2025-05-14',
    totalAmount: 12500.00,
    currency: 'INR',
    status: 'Processed',
    receivedOn: '2025-05-14T15:10:00Z',
    extractionConfidence: 96,
    lineItems: [],
    subtotal: 10593.22,
    cgst: 953.39,
    sgst: 953.39,
    anomalies: [],
    createdAt: '2025-05-14T15:10:00Z',
  },
];

const mockInvoices: Invoice[] = mockInvoicesRaw.map((inv) => ({
  ...inv,
  status: inv.status as InvoiceStatus,
  invoiceNumber: inv.invoiceId,
  anomalies: inv.anomalies.map((anom) => ({
    type: anom.type as any,
    description: anom.description,
    severity: anom.severity as any,
  })),
}));

export default function InvoiceList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedVendor, setSelectedVendor] = useState('All Vendors');

  const filteredInvoices = useMemo(() => {
    return mockInvoices.filter((invoice) => {
      // Search term filter
      const matchesSearch =
        invoice.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.vendorName.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        selectedStatus === 'All Status' || invoice.status === selectedStatus;

      // Vendor filter
      const matchesVendor =
        selectedVendor === 'All Vendors' || invoice.vendorName === selectedVendor;

      return matchesSearch && matchesStatus && matchesVendor;
    });
  }, [searchTerm, selectedStatus, selectedVendor]);

  const handleExport = () => {
    // Mock export download trigger
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredInvoices, null, 2)
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

      <InvoiceTable
        invoices={filteredInvoices}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
}
