'use client';

import { FileText, File, Presentation, Sheet, ExternalLink } from 'lucide-react';
import { Citation } from '@/lib/types';

interface CitationCardProps {
  citation: Citation;
  index: number;
  documentName?: string;
  fileType?: string;
  onView: (citation: Citation) => void;
}

const fileIcons = {
  PDF: FileText,
  DOCX: File,
  PPTX: Presentation,
  XLSX: Sheet,
};

export function CitationCard({ citation, index, documentName, fileType = 'PDF', onView }: CitationCardProps) {
  const Icon = fileIcons[fileType as keyof typeof fileIcons] || FileText;
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              [{index + 1}]
            </span>
            <span className="text-sm font-medium text-gray-900 truncate">
              {documentName || 'Document'}
            </span>
            {citation.page > 0 && (
              <span className="text-xs text-gray-500">
                Page {citation.page}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-3 italic">
            "{citation.excerpt}"
          </p>
        </div>
        <button
          onClick={() => onView(citation)}
          className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="View in document"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
