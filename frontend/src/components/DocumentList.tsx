'use client';

import { Document } from '@/lib/types';
import { File, Trash2, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function DocumentList({ documents, onDelete, loading }: DocumentListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFileIcon = (fileType: string) => {
    return <File className="h-8 w-8 text-blue-500" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'READY':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PROCESSING':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">Loading documents...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <File className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>No documents uploaded yet</p>
        <p className="text-sm mt-1">Upload your first document to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
        >
          <div className="flex items-start space-x-3">
            {getFileIcon(doc.fileType)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate" title={doc.filename}>
                {doc.filename}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {doc.fileType} • {doc.chunkCount} chunks
              </p>
              <div className="flex items-center mt-2 text-xs text-gray-400">
                <Clock className="h-3 w-3 mr-1" />
                {formatDate(doc.createdAt)}
              </div>
            </div>
            <button
              onClick={() => onDelete(doc.id)}
              className="text-gray-400 hover:text-red-500"
              title="Delete document"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mt-3 flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                doc.status === 'READY'
                  ? 'bg-green-100 text-green-800'
                  : doc.status === 'PROCESSING'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {getStatusIcon(doc.status)}
              <span className="ml-1">{doc.status}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
