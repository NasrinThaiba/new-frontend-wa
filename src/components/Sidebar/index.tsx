import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { fetchConversations, setActiveConversation, setSearchQuery, createConversation } from '../../store/slices/chatSlice';
import { logoutUser } from '../../store/slices/authSlice';
import { toggleNewChat, closeNewChat, toggleSettings } from '../../store/slices/uiSlice';
import { joinConversation } from '../../services/socket';
import { Avatar, MessageTicks, ContextMenu, type ContextMenuItem } from '../Common';
import { SearchIcon, NewChatIcon, MoreIcon, CloseIcon } from '../Common/Icons';
import { type Conversation, type User } from '../../types';
import api from '../../services/api';

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { conversations, activeConversationId, searchQuery, isLoadingConversations } = useAppSelector((s) => s.chat);
  const { user } = useAppSelector((s) => s.auth);
  const { showNewChat } = useAppSelector((s) => s.ui);

  useEffect(() => { dispatch(fetchConversations()); }, [dispatch]);

  const filtered = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const name = getConvName(conv, user?._id);
    return name.toLowerCase().includes(searchQuery.toLowerCase()); //to find the even single letter present in the username
  });

  return (
    <div className="w-[380px] flex-shrink-0 bg-[#111b21] flex flex-col border-r border-[#2a3942] overflow-hidden">
      <SidebarHeader />
      <SearchBar />
      <div className="flex-1 overflow-y-auto">
        {showNewChat ? (
          <NewChatPanel />
        ) : isLoadingConversations ? (
          <div className="flex items-center justify-center h-32">
            <svg className="animate-spin w-6 h-6 text-[#00a884]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#8696a0] text-sm gap-2">
            <SearchIcon className="w-8 h-8 opacity-40" />
            <p>{searchQuery ? 'No chats found' : 'No conversations yet'}</p>
            <button onClick={() => dispatch(toggleNewChat())} className="text-[#00a884] text-xs hover:underline">
              Start a new chat
            </button>
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem key={conv._id} conversation={conv}
              isActive={activeConversationId === conv._id}
              currentUserId={user?._id}
              onClick={() => {
                dispatch(setActiveConversation(conv._id));
                joinConversation(conv._id);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ─── SidebarHeader ────────────────────────────────────────────────────────────
const SidebarHeader: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [showMenu, setShowMenu] = useState(false);

  const menuItems: ContextMenuItem[] = [
    { label: 'Settings', action: () => dispatch(toggleSettings()) },
    { label: 'Log out', action: () => dispatch(logoutUser()), danger: true },
  ];

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#202c33] flex-shrink-0">
      <Avatar user={user} size="md" />
      <div className="flex items-center gap-1">
        <button onClick={() => dispatch(toggleNewChat())} title="New chat"
          className="p-2 text-[#aebac1] hover:text-white rounded-full transition-colors">
          <NewChatIcon />
        </button>
        <div className="relative">
          <button onClick={() => setShowMenu(v => !v)} title="Menu"
            className="p-2 text-[#aebac1] hover:text-white rounded-full transition-colors">
            <MoreIcon />
          </button>
          {showMenu && (
            <div className="absolute top-10 right-0 z-50 bg-[#233138] rounded-xl shadow-2xl py-2 min-w-44 border border-[#2a3942]">
              {menuItems.map((item, i) => (
                <button key={i} onClick={() => { item.action(); setShowMenu(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#2a3942] ${item.danger ? 'text-red-400' : 'text-[#e9edef]'}`}>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── SearchBar ────────────────────────────────────────────────────────────────
const SearchBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const query = useAppSelector((s) => s.chat.searchQuery);
  return (
    <div className="px-3 py-2 bg-[#111b21] flex-shrink-0">
      <div className="flex items-center gap-2 bg-[#202c33] rounded-xl px-3 py-2">
        <SearchIcon className="w-5 h-5 text-[#aebac1]" />
        <input value={query} onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          placeholder="Search or start new chat"
          className="bg-transparent text-[#e9edef] text-sm placeholder-[#8696a0] outline-none flex-1" />
        {query && (
          <button onClick={() => dispatch(setSearchQuery(''))} className="text-[#aebac1] hover:text-white">
            <CloseIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── NewChatPanel ─────────────────────────────────────────────────────────────
const NewChatPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.trim().length < 1) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
        setResults(res.data.users);
      } catch { setResults([]); }
      finally { setIsSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const startChat = async (userId: string) => {
    await dispatch(createConversation(userId));
    dispatch(closeNewChat());
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#202c33]">
        <button onClick={() => dispatch(closeNewChat())} className="text-[#aebac1] hover:text-white transition-colors">
          <CloseIcon />
        </button>
        <span className="text-[#e9edef] font-medium">New chat</span>
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 bg-[#202c33] rounded-xl px-3 py-2">
          <SearchIcon className="w-5 h-5 text-[#aebac1]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email" autoFocus
            className="bg-transparent text-[#e9edef] text-sm placeholder-[#8696a0] outline-none flex-1" />
        </div>
      </div>
      {isSearching && (
        <div className="flex justify-center py-4">
          <svg className="animate-spin w-5 h-5 text-[#00a884]" fill= "none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      )}
      {results.map((user) => (
        <button key={user._id} onClick={() => startChat(user._id)}
          className="flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] transition-colors text-left">
          <Avatar user={user} showOnline={true} />
          <div>
            <p className="text-[#e9edef] text-sm font-medium">{user.name}</p>
            <p className="text-[#8696a0] text-xs">{user.status}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

// ─── ConversationItem ─────────────────────────────────────────────────────────
const ConversationItem: React.FC<{
  conversation: Conversation;
  isActive: boolean;
  currentUserId?: string;
  onClick: () => void;
}> = ({ conversation, isActive, currentUserId, onClick }) => {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const otherParticipant = conversation.participants.find((p) => p._id !== currentUserId);
  const displayUser = conversation.isGroup ? null : otherParticipant;
  const name = conversation.isGroup ? conversation.groupName : otherParticipant?.name;
  const avatar = conversation.isGroup
    ? conversation.groupAvatar
    : otherParticipant?.avatar;

  const lastMsg = conversation.lastMessage;
  const isMe = lastMsg && typeof lastMsg.sender !== 'string' && (lastMsg.sender as User)?._id === currentUserId;
  
  const menuItems: ContextMenuItem[] = [
    { label: 'Archive', action: () => {} },
    { label: 'Delete chat', action: () => {}, danger: true },
  ];

  const fakeUser: User = {
    _id: conversation.isGroup ? conversation._id : (otherParticipant?._id ?? ''),
    name: name ?? 'Unknown',
    email: '',
    phone: "",
    avatar: avatar,
    status: '',
    isOnline: displayUser?.isOnline ?? false,
    lastSeen: displayUser?.lastSeen,
  };

  return (
    <>
      <div onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }); }}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors ${isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'}`}>
        <Avatar user={fakeUser} showOnline={!conversation.isGroup} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[#e9edef] text-sm font-medium truncate">{name}</span>
            <span className="text-[11px] text-[#8696a0] flex-shrink-0 ml-1">
              {lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {isMe && lastMsg && <span className="text-[#8696a0] flex-shrink-0"><MessageTicks status={lastMsg.status} /></span>}
              <span className="text-[#8696a0] text-xs truncate">
                {lastMsg?.text ?? 'No messages yet'}
              </span>
            </div>
          </div>
        </div>
      </div>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />}
    </>
  );
};

// Helper
export const getConvName = (conv: Conversation, currentUserId?: string): string => {
  if (conv.isGroup) return conv.groupName ?? 'Group';
  const other = conv.participants.find((p) => p._id !== currentUserId);
  return other?.name ?? 'Unknown';
};

export default Sidebar;
