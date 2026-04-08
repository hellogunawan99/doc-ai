'use client';

import { useState, useEffect } from 'react';
import { Send, Bot, User, LogOut, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { CitationCard } from '@/components/CitationCard';
import dynamic from 'next/dynamic';
import { Citation } from '@/lib/types';

const PDFViewer = dynamic(
  () => import('@/components/PDFViewer').then(mod => mod.PDFViewer),
  { ssr: false }
);

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pdfViewerData, setPdfViewerData] = useState<{
    citation: Citation;
    documentName: string;
    documentUrl: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const lastConversation = localStorage.getItem('lastConversationId');
    if (lastConversation) {
      loadHistory(lastConversation);
    }
  }, []);

  const loadHistory = async (convId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/chat/history/${convId}`, {
        headers: { 'Authorization': `Bearer ${api.getToken()}` },
      });
      if (response.ok) {
        const history = await response.json();
        setMessages(history.map((m: any) => ({
          role: m.role.toLowerCase(),
          content: m.content,
          sources: m.sources || [],
          confidence: m.confidence
        })));
        setConversationId(convId);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleSelectConversation = (id: string) => {
    loadHistory(id);
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    localStorage.removeItem('lastConversationId');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.getToken()}`,
        },
        body: JSON.stringify({ content: userMessage, conversationId }),
      });

      const data = await response.json();
      
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem('lastConversationId', data.conversationId);
      }
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.content,
          sources: data.sources || [],
          confidence: data.confidence,
        },
      ]);
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error: Could not connect to chat service.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.signout();
    router.push('/login');
  };

  const handleViewCitation = async (citation: Citation) => {
    try {
      const response = await fetch(`http://localhost:8000/api/documents/${citation.document_id}`, {
        headers: { 'Authorization': `Bearer ${api.getToken()}` },
      });
      if (response.ok) {
        const doc = await response.json();
        setPdfViewerData({
          citation,
          documentName: doc.filename,
          documentUrl: `http://localhost:8000/${doc.filePath.replace('backend/', '')}`,
        });
      }
    } catch (error) {
      console.error('Failed to load document:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        currentConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
      />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">DocClaw Chat</h1>
            <div className="flex items-center space-x-4">
              <Link
                href="/documents"
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Welcome to DocClaw!</p>
                <p className="mt-2">Ask questions about your uploaded documents</p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-2 max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-shrink-0">
                    {message.role === 'user' ? (
                      <User className="h-8 w-8 text-blue-500" />
                    ) : (
                      <Bot className="h-8 w-8 text-green-500" />
                    )}
                  </div>
                  <div className={`rounded-lg p-4 ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'assistant' && message.sources && message.sources.length > 0 && Array.isArray(message.sources) && message.sources[0] && typeof message.sources[0] === 'object' && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-gray-500 font-medium">Sources:</p>
                      {(message.sources as Citation[]).map((citation: Citation, idx: number) => (
                        <CitationCard
                          key={citation.chunk_id}
                          citation={citation}
                          index={idx}
                          onView={handleViewCitation}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[70%]">
                  <Bot className="h-8 w-8 text-green-500" />
                  <div className="rounded-lg p-4 bg-gray-100">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t bg-white p-4 rounded-lg">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your documents..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </main>
      </div>

      {pdfViewerData && (
        <PDFViewer
          citation={pdfViewerData.citation}
          documentName={pdfViewerData.documentName}
          documentUrl={pdfViewerData.documentUrl}
          onClose={() => setPdfViewerData(null)}
        />
      )}
    </div>
  );
}
