'use client';

import { useState, useRef } from 'react';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadStatus('Uploading...');
    
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const token = api.getToken();
        const response = await fetch('http://localhost:8000/api/documents/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Upload failed');
        }

        const result = await response.json();
        setUploadStatus(`Uploaded: ${result.filename} (${result.chunkCount} chunks)`);
      }
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleUpload(e.target.files)}
        accept=".pdf,.docx,.pptx,.xlsx"
        multiple
        className="hidden"
      />
      
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      
      <h3 className="mt-2 text-sm font-semibold text-gray-900">
        {uploading ? 'Uploading...' : 'Upload Documents'}
      </h3>
      
      <p className="mt-1 text-xs text-gray-500">
        PDF, DOCX, PPTX, or XLSX
      </p>
      
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center mx-auto"
      >
        {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Select Files
      </button>
      
      {uploadStatus && (
        <p className="mt-2 text-xs text-gray-600">{uploadStatus}</p>
      )}
    </div>
  );
}
