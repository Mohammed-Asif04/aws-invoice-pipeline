import { useCallback, useState } from 'react';
import { CloudUpload, FileText, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UploadedFile } from '@/types';

interface FileUploadZoneProps {
  uploadedFile: UploadedFile | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
}

export default function FileUploadZone({ uploadedFile, onFileSelect, onFileRemove }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/40 hover:bg-accent/50'
        }`}
      >
        <input
          type="file"
          id="invoice-upload"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isDragOver ? 'bg-primary/15' : 'bg-primary/8'
          }`}>
            <CloudUpload className={`w-7 h-7 transition-colors ${
              isDragOver ? 'text-primary' : 'text-primary/60'
            }`} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Drag and drop your invoice here
            </p>
            <p className="text-xs text-muted-foreground mt-1">or</p>
          </div>
          <Button
            type="button"
            size="sm"
            className="pointer-events-none"
          >
            Browse Files
          </Button>
          <p className="text-xs text-muted-foreground">
            Supports PDF, PNG, JPG (Max size: 10MB)
          </p>
        </div>
      </div>

      {/* Uploaded File */}
      {uploadedFile && (
        <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {uploadedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(uploadedFile.size)}
            </p>
          </div>
          {uploadedFile.uploadStatus === 'complete' && (
            <div className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium">Upload complete</span>
            </div>
          )}
          <button
            onClick={onFileRemove}
            className="p-1 rounded hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}
