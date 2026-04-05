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
