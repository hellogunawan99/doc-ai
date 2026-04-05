'use client';

import { useEffect, useState } from 'react';
import { DocumentUpload } from '@/components/DocumentUpload';
import { DocumentList } from '@/components/DocumentList';
import { Document } from '@/lib/types';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { FileText, ArrowLeft, Loader2 } from 'lucide-react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const token = api.getToken();
      const response = await fetch('http://localhost:8000/api/documents/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to load documents');
      }
      
      const data = await response.json();
      setDocuments(data);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const token = api.getToken();
      const response = await fetch(`http://localhost:8000/api/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      setDocuments(documents.filter((doc) => doc.id !== id));
    } catch (err: any) {
      console.error('Failed to delete document:', err);
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/chat')}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">
                Document Library
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Upload Documents</h2>
          <DocumentUpload onUploadComplete={loadDocuments} />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Your Documents</h2>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Loading documents...</p>
            </div>
          ) : (
            <DocumentList 
              documents={documents} 
              onDelete={handleDelete}
              loading={loading}
            />
          )}
        </div>
      </main>
    </div>
  );
}
