'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Citation } from '@/lib/types';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  citation: Citation;
  documentName: string;
  documentUrl: string;
  onClose: () => void;
}

export function PDFViewer({ citation, documentName, documentUrl, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(citation.page || 1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(citation.page || 1);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-medium text-gray-900">{documentName}</h3>
            <p className="text-sm text-gray-500">Page {pageNumber} of {numPages}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={documentUrl}
              download={documentName}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Download"
            >
              <Download className="h-5 w-5 text-gray-600" />
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto bg-gray-100 flex justify-center">
          <Document
            file={documentUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            }
          >
            <Page 
              pageNumber={pageNumber}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg"
            />
          </Document>
        </div>
        
        <div className="flex items-center justify-center gap-4 p-4 border-t">
          <button
            onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-gray-600">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
            disabled={pageNumber >= numPages}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        
        {citation.excerpt && (
          <div className="p-4 bg-blue-50 border-t">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Highlighted text:</span> "{citation.excerpt}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
