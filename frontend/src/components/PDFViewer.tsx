import { useState, useEffect, useMemo } from 'react';
import { Maximize2, ExternalLink, FileText, ZoomIn, ZoomOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PDFViewerProps {
  fileName?: string;
  file?: File | null;
  title?: string;
  showOpenInNewTab?: boolean;
  fallbackMessage?: string;
  fallbackSubMessage?: string;
}

export default function PDFViewer({ fileName: _fileName, file, title, showOpenInNewTab, fallbackMessage, fallbackSubMessage }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100);

  // Create a blob URL for the uploaded file
  const blobUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  // Revoke the blob URL when the component unmounts or file changes
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const isPDF = file?.type === 'application/pdf';
  const isImage = file?.type?.startsWith('image/');

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  const handleOpenFullSize = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold font-heading">
          {title || '3. Document Preview'}
        </CardTitle>
        {showOpenInNewTab ? (
          <button
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors border border-border px-2.5 py-1 rounded-md bg-card disabled:opacity-40"
            onClick={handleOpenFullSize}
            disabled={!blobUrl}
          >
            Open in New Tab
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-40"
            onClick={handleOpenFullSize}
            disabled={!blobUrl}
          >
            View Full Size
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {file && blobUrl ? (
          <>
            {/* PDF Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d3f] text-white text-xs">
              <div className="flex items-center gap-2">
                <span className="text-white/70 truncate max-w-[180px]">{file.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="text-white/60 hover:text-white transition-colors p-0.5"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-white/80 text-[11px] min-w-[36px] text-center">{zoom}%</span>
                <button
                  className="text-white/60 hover:text-white transition-colors p-0.5"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Dynamic file preview */}
            <div className="overflow-auto bg-gray-100 dark:bg-neutral-900" style={{ maxHeight: '520px' }}>
              {isPDF ? (
                <iframe
                  src={`${blobUrl}#toolbar=0&navpanes=0`}
                  title="PDF Preview"
                  className="w-full border-0 bg-white"
                  style={{
                    height: '500px',
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top left',
                    width: `${10000 / zoom}%`,
                  }}
                />
              ) : isImage ? (
                <div className="flex items-center justify-center p-4">
                  <img
                    src={blobUrl}
                    alt="Uploaded invoice preview"
                    className="max-w-full rounded shadow-sm transition-transform duration-200"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileText className="w-12 h-12 mb-3 opacity-40" />
                  <p className="text-sm font-medium">Unsupported file format</p>
                  <p className="text-xs mt-1">Only PDF, PNG, and JPG files can be previewed.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty state — no file selected */
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{fallbackMessage || 'No document selected'}</p>
            <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-[220px] leading-relaxed">
              {fallbackSubMessage || 'Upload a PDF, PNG, or JPG invoice file to see a live preview here.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
