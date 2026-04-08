'use client';

import { useState, useEffect } from 'react';
import { Menu, Plus, ChevronLeft, ChevronRight, Trash2, MessageCircle } from 'lucide-react';
import { ConversationItem } from './ConversationItem';
import { api } from '@/lib/api';

interface Conversation {
  id: string;
  updatedAt: string;
  messages: Array<{
    content: string;
    createdAt: string;
  }>;
}

interface SidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

export function Sidebar({ currentConversationId, onSelectConversation, onNewChat }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarExpanded');
    if (saved !== null) {
      setExpanded(saved === 'true');
    }
    loadConversations();
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarExpanded', String(expanded));
  }, [expanded]);

  const loadConversations = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/chat/conversations', {
        headers: { 'Authorization': `Bearer ${api.getToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/chat/conversations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${api.getToken()}` },
      });
      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (currentConversationId === id) {
          onNewChat();
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const getFirstMessage = (conversation: Conversation) => {
    if (conversation.messages && conversation.messages.length > 0) {
      return conversation.messages[0].content;
    }
    return 'New conversation';
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!expanded) {
    return (
      <div className="h-screen bg-gray-100 border-r border-gray-200 flex flex-col items-center py-4 w-16">
        <button
          onClick={() => setExpanded(true)}
          className="p-2 hover:bg-gray-200 rounded-lg mb-4"
          title="Expand sidebar"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
        
        <button
          onClick={onNewChat}
          className="p-2 hover:bg-gray-200 rounded-lg mb-4"
          title="New chat"
        >
          <Plus className="h-5 w-5 text-gray-600" />
        </button>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`p-2 rounded-lg mb-2 w-10 h-10 flex items-center justify-center ${
                currentConversationId === conv.id ? 'bg-blue-100' : 'hover:bg-gray-200'
              }`}
              title={getFirstMessage(conv)}
            >
              <MessageCircle className="h-4 w-4 text-gray-600" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 border-r border-gray-200 flex flex-col w-64">
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <button
          onClick={() => setExpanded(false)}
          className="p-2 hover:bg-gray-200 rounded-lg"
          title="Collapse sidebar"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No conversations yet
          </div>
        ) : (
          conversations.map(conv => (
            <ConversationItem
              key={conv.id}
              id={conv.id}
              preview={getFirstMessage(conv)}
              time={getRelativeTime(conv.updatedAt)}
              isActive={currentConversationId === conv.id}
              onClick={() => onSelectConversation(conv.id)}
              onDelete={(e) => handleDelete(conv.id, e)}
            />
          ))
        )}
      </div>
    </div>
  );
}
