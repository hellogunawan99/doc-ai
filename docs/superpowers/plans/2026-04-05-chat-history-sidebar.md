# Chat History Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a collapsible sidebar to the chat page showing conversation history, allowing users to click and continue previous conversations.

**Architecture:** Collapsible sidebar (~250px expanded, ~60px collapsed) on the left of chat. Main chat area on the right. State managed via React hooks and localStorage for persistence.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Lucide React icons

---

## File Structure

**Backend:**
- Modify: `backend/app/routers/chat.py` - Add DELETE endpoint

**Frontend:**
- Create: `frontend/src/components/Sidebar.tsx` - Main sidebar component
- Create: `frontend/src/components/ConversationItem.tsx` - Individual conversation list item
- Modify: `frontend/src/app/chat/page.tsx` - Add sidebar to layout

---

## Tasks

### Task 1: Add DELETE conversation endpoint

**Files:**
- Modify: `backend/app/routers/chat.py`

- [ ] **Step 1: Add DELETE endpoint to chat router**

Add after line 130 in `backend/app/routers/chat.py`:

```python
@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    await prisma.connect()
    try:
        employee = await prisma.employee.find_unique(
            where={"email": current_user["email"]}
        )
        if not employee:
            raise HTTPException(status_code=404, detail="User not found")
        
        conversation = await prisma.conversation.find_unique(
            where={"id": conversation_id}
        )
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if conversation.employeeId != employee.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        await prisma.message.delete_many(
            where={"conversationId": conversation_id}
        )
        
        await prisma.conversation.delete(
            where={"id": conversation_id}
        )
        
        return {"message": "Conversation deleted"}
    finally:
        await prisma.disconnect()
```

- [ ] **Step 2: Test the endpoint**

Run: `curl -X DELETE http://localhost:8000/api/chat/conversations/test-id -H "Authorization: Bearer TOKEN"`

- [ ] **Step 3: Commit**

```bash
git add backend/app/routers/chat.py
git commit -m "feat: add DELETE conversation endpoint"
```

---

### Task 2: Create Sidebar component

**Files:**
- Create: `frontend/src/components/Sidebar.tsx`

- [ ] **Step 1: Create Sidebar component**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Sidebar.tsx
git commit -m "feat: create Sidebar component"
```

---

### Task 3: Create ConversationItem component

**Files:**
- Create: `frontend/src/components/ConversationItem.tsx`

- [ ] **Step 1: Create ConversationItem component**

```tsx
'use client';

import { Trash2 } from 'lucide-react';

interface ConversationItemProps {
  id: string;
  preview: string;
  time: string;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function ConversationItem({ preview, time, isActive, onClick, onDelete }: ConversationItemProps) {
  const truncatedPreview = preview.length > 50 ? preview.substring(0, 50) + '...' : preview;
  
  return (
    <div
      onClick={onClick}
      className={`group p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
        isActive 
          ? 'bg-blue-100 hover:bg-blue-150' 
          : 'hover:bg-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            You: {truncatedPreview}
          </p>
          <p className="text-xs text-gray-500 mt-1">{time}</p>
        </div>
        
        <button
          onClick={onDelete}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-opacity"
          title="Delete conversation"
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ConversationItem.tsx
git commit -m "feat: create ConversationItem component"
```

---

### Task 4: Update ChatPage layout

**Files:**
- Modify: `frontend/src/app/chat/page.tsx`

- [ ] **Step 1: Add sidebar import and update component**

Replace the entire `frontend/src/app/chat/page.tsx` with:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Send, Bot, User, LogOut, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
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
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/chat/page.tsx
git commit -m "feat: add sidebar to chat page with conversation history"
```

---

## Acceptance Criteria Checklist

- [ ] Sidebar toggles smoothly between expanded/collapsed
- [ ] Conversation list shows preview + time
- [ ] Clicking conversation loads its messages
- [ ] "New Chat" starts fresh conversation
- [ ] Delete conversation removes it from list
- [ ] Sidebar state persists across page refreshes
- [ ] All code committed to git

---

## Push to GitHub

After all tasks complete:

```bash
git push origin main
```
