import { useState } from 'react';
import { Search, Download, Plus, Calendar, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

interface FilterBarProps {
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onVendorChange: (value: string) => void;
  onDateRangeChange: (value: string) => void;
  onExport: () => void;
}

const vendors = [
  'All Vendors',
  'ABC Solutions Ltd.',
  'TechCorp India',
  'Global Supplies',
  'Office Needs Co.',
  'Digital Services',
  'BufferOn Pvt. Ltd.',
  'Info Systems',
  'Data Experts',
];

const statuses = [
  'All Status',
  'Processed',
  'In Progress',
  'In Review',
  'Exception',
  'Resolved',
];

export default function FilterBar({
  onSearchChange,
  onStatusChange,
  onVendorChange,
  onDateRangeChange: _onDateRangeChange,
  onExport,
}: FilterBarProps) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearchChange(e.target.value);
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Top row: Search + Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice ID, vendor, GSTIN, invoice number..."
            value={searchValue}
            onChange={handleSearchChange}
            className="pl-10 h-10 w-full bg-card border-border"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onExport}
            className="h-10 text-sm gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            onClick={() => navigate('/upload')}
            className="h-10 text-sm gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            <Plus className="w-4 h-4" />
            Upload Invoice
          </Button>
        </div>
      </div>

      {/* Bottom row: Dropdown filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Status Filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Status
          </label>
          <Select defaultValue="All Status" onValueChange={(val) => onStatusChange(val || '')}>
            <SelectTrigger className="h-10 bg-card border-border">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Date Range
          </label>
          <button className="flex items-center justify-between w-full h-10 px-3 rounded-lg border border-border bg-card text-sm text-foreground/80 hover:bg-accent/50 transition-colors">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              May 12 – May 18, 2025
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Vendor Filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Vendor
          </label>
          <Select defaultValue="All Vendors" onValueChange={(val) => onVendorChange(val || '')}>
            <SelectTrigger className="h-10 bg-card border-border">
              <SelectValue placeholder="All Vendors" />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((vendor) => (
                <SelectItem key={vendor} value={vendor}>
                  {vendor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* More Filters button */}
        <div className="flex items-end">
          <Button
            variant="outline"
            className="h-10 w-full text-sm gap-2 border-border bg-card"
          >
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            More Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
