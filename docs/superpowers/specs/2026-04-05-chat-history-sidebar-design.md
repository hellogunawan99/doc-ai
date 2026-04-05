# Chat History Sidebar - Design Spec

## Overview

Add a collapsible sidebar to the chat page that shows conversation history, allowing users to click and continue previous conversations.

## Layout

### Structure
- **Collapsible sidebar** on the left side of the chat page
- **Expanded state**: ~250px wide, shows full conversation list
- **Collapsed state**: ~60px wide, shows only icons
- **Main chat area**: Takes remaining space

### Components

#### Sidebar Toggle Button
- Position: Top of sidebar (collapsed) or top-left (expanded)
- Icon: Chevron (→ when collapsed, ← when expanded)
- Click: Toggles sidebar state with smooth animation (200ms)

#### Sidebar Content (expanded)
1. **New Chat Button**
   - Full-width button at top
   - Text: "New Chat" with Plus icon
   - Action: Clears main area, starts fresh conversation

2. **Conversation List**
   - Sorted by most recent (updatedAt desc)
   - Each item shows:
     - Preview: "You: [first message, truncated to 50 chars]..."
     - Relative time: "Today", "Yesterday", or date
   - Active conversation: highlighted background
   - Hover: shows delete icon (trash)

#### Collapsed Sidebar
- Shows only icons:
  - New Chat (plus icon)
  - Conversation list (chat bubble icons)
  - Toggle button

## Interactions

1. **Toggle sidebar**: Click chevron → smooth slide animation
2. **Select conversation**: Click item → loads messages in main area
3. **Start new chat**: Click "New Chat" → clears area, creates new conversation
4. **Delete conversation**: Click trash icon → confirm modal → delete
5. **Persist state**: Sidebar expanded/collapsed state saved to localStorage

## Data Flow

### Backend (already exists)
- `GET /api/chat/conversations` - returns list with message previews
- `GET /api/chat/history/{id}` - returns full message list
- Need to add: `DELETE /api/chat/conversations/{id}`

### Frontend State
- `conversations[]` - list of conversations
- `currentConversationId` - active conversation ID
- `messages[]` - current conversation messages
- `sidebarExpanded` - boolean, persisted to localStorage

## Implementation Order

1. Backend: Add delete conversation endpoint
2. Frontend: Create Sidebar component
3. Frontend: Create ConversationItem component
4. Frontend: Update ChatPage layout with sidebar
5. Frontend: Wire up API calls and state management
6. Frontend: Add delete functionality
7. Frontend: Add localStorage persistence for sidebar state

## Acceptance Criteria

- [ ] Sidebar toggles smoothly between expanded/collapsed
- [ ] Conversation list shows preview + time
- [ ] Clicking conversation loads its messages
- [ ] "New Chat" starts fresh conversation
- [ ] Delete conversation removes it from list
- [ ] Sidebar state persists across page refreshes
