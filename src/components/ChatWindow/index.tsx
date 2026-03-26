
import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { fetchMessages } from '../../store/slices/chatSlice';
import { toggleContactInfo } from '../../store/slices/uiSlice';
import { emitTypingStart, emitTypingStop, emitMessageRead, getSocket } from '../../services/socket';
import api from '../../services/api';
import { Avatar, EmojiPicker, ContextMenu, ContextMenuItem, MessageTicks } from '../Common';
import { VideoIcon, PhoneIcon, SearchIcon, MoreIcon, EmojiIcon, AttachIcon, SendIcon, MicIcon, CloseIcon } from '../Common/Icons';
import { Message, User } from '../../types';

// ─── ChatWindow ───────────────────────────────────────────────────────────────
const ChatWindow: React.FC = () => {
  const { activeConversationId, conversations } = useAppSelector((s) => s.chat);
  const { showContactInfo } = useAppSelector((s) => s.ui);
  const { user } = useAppSelector((s) => s.auth);
  //const dispatch = useAppDispatch();

  if (!activeConversationId) return <EmptyState />;

  const conversation = conversations.find((c) => c._id === activeConversationId);
  if (!conversation) return <EmptyState />;

  const otherParticipant = conversation.participants.find((p) => p._id !== user?._id);
  const displayUser: User = conversation.isGroup
    ? { _id: conversation._id, name: conversation.groupName ?? 'Group', phone: '', email: "", status: '', isOnline: false, avatar: conversation.groupAvatar }
    : (otherParticipant ?? { _id: '', name: 'Unknown', phone: '',email: "", status: '', isOnline: false, avatar: ""});

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        <ChatHeader displayUser={displayUser} conversationId={activeConversationId} isGroup={conversation.isGroup} />
        <MessageList conversationId={activeConversationId} currentUserId={user?._id} />
        <ChatInput conversationId={activeConversationId} />
      </div>
      {showContactInfo && <ContactInfoPanel user={displayUser} isGroup={conversation.isGroup} conversation={conversation} />}
    </div>
  );
};

// ─── ChatHeader ───────────────────────────────────────────────────────────────
const ChatHeader: React.FC<{ displayUser: User; conversationId: string; isGroup: boolean }> = ({
  displayUser, conversationId, isGroup,
}) => {
  const dispatch = useAppDispatch();
  const typingUsers = useAppSelector((s) => s.chat.typingUsers[conversationId] ?? {}); //typinguser for particular conversation
  const typingNames = Object.values(typingUsers); //typingUsers is object(key), we want only values

  const subtitle = typingNames.length > 0
    ? `${typingNames.join(', ')} typing...`
    : isGroup ? 'Group chat'
    : displayUser.isOnline ? 'online'
    : displayUser.lastSeen ? `last seen ${new Date(displayUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'offline';

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-[#202c33] border-b border-[#2a3942] flex-shrink-0">
      <button className="flex items-center gap-3 text-left" onClick={() => dispatch(toggleContactInfo())}>
        <Avatar user={displayUser} showOnline={!isGroup} />
        <div>
          <h3 className="text-[#e9edef] text-sm font-medium">{displayUser.name}</h3>
          <p className={`text-xs ${typingNames.length > 0 ? 'text-[#00a884]' : 'text-[#8696a0]'}`}>{subtitle}</p>
        </div>
      </button>
      <div className="flex items-center gap-1">
        {[{ icon: <VideoIcon />, label: 'Video' }, { icon: <PhoneIcon />, label: 'Call' }, { icon: <SearchIcon />, label: 'Search' }, { icon: <MoreIcon />, label: 'More' }].map((b) => (
          <button key={b.label} title={b.label} className="p-2 text-[#aebac1] hover:text-white rounded-full transition-colors">{b.icon}</button>
        ))}
      </div>
    </div>
  );
};

// ─── MessageList ──────────────────────────────────────────────────────────────
const MessageList: React.FC<{ conversationId: string; currentUserId?: string }> = ({
  conversationId, currentUserId,
}) => {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((s) => s.chat.messages[conversationId] ?? []);
  const typingUsers = useAppSelector((s) => s.chat.typingUsers[conversationId] ?? {});
  const isLoading = useAppSelector((s) => s.chat.isLoadingMessages);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchMessages({ conversationId }));
    emitMessageRead(conversationId);
  }, [conversationId, dispatch]); //change for each conversationId, dispatch which used inside the useeffect

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typingUsers]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b141a]">
        <svg className="animate-spin w-8 h-8 text-[#00a884]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#0b141a]">
      <div className="max-w-3xl mx-auto space-y-1">
        {messages.length === 0 && (
          <div className="flex justify-center py-8">
            <span className="bg-[#182229] text-[#8696a0] text-xs px-4 py-2 rounded-full">
              No messages yet. Say hello! 
            </span>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble 
            key={msg._id} 
            message={msg}
            isMe={typeof msg.sender === 'string' ? msg.sender === currentUserId : (msg.sender as User)._id === currentUserId}
            conversationId={conversationId}
          />
        ))}

        {Object.keys(typingUsers).length > 0 && (
          <div className="flex justify-start mb-2">
            <div className="bg-[#202c33] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};

// ─── MessageBubble ────────────────────────────────────────────────────────────
const MessageBubble: React.FC<{ message: Message; isMe: boolean; conversationId: string }> = ({
  message, isMe, conversationId,
}) => {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const handleDelete = async (deleteFor: 'me' | 'everyone') => {
    try {
      await api.delete(`/messages/${message._id}`, { data: { deleteFor } });
      getSocket()?.emit('message:deleted', { messageId: message._id, conversationId });
    } catch (err) { console.error('Delete failed', err); }
  };

  const menuItems: ContextMenuItem[] = [
    // { label: 'Reply', action: () => {} },
    // { label: 'Star message', action: () => {} },
    ...(isMe ? [{ label: 'Delete for everyone', action: () => handleDelete('everyone'), danger: true }] : []),
    { label: 'Delete for me', action: () => handleDelete('me'), danger: true },
  ];

  const senderName = typeof message.sender === 'string' ? '' : (message.sender as User).name;
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1 group`}>

        <div className={`relative max-w-xs lg:max-w-md xl:max-w-lg ${isMe ? 'order-2' : 'order-1'}`}> 
          {/* avartar message */}

          <div onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }); }}
            className={`px-3 py-2 rounded-2xl shadow-md cursor-pointer select-text transition-all hover:brightness-110
              ${isMe ? 'bg-[#005c4b] rounded-tr-sm' : 'bg-[#202c33] rounded-tl-sm'}`}>

            {!isMe && senderName && (
              <p className="text-[#00a884] text-xs font-medium mb-1">{senderName}</p>
            )}

            <p className="text-[#e9edef] text-sm leading-relaxed break-words">{message.text}</p>

            <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
              <span className="text-[10px] text-[#8696a0]">{time}</span>
              {isMe && <span className="text-[#8696a0]"><MessageTicks status={message.status} /></span>}
            </div>
            </div>

          {/* {message.reactions?.length > 0 && (
            <div className={`absolute -bottom-2 ${isMe ? 'right-2' : 'left-2'} bg-[#2a3942] rounded-full px-1.5 py-0.5 text-xs shadow flex gap-0.5`}>
              {message.reactions.slice(0, 3).map((r, i) => <span key={i}>{r.emoji}</span>)}
            </div>
          )} */}
          <button onClick={(e) => { e.stopPropagation(); setMenu({ x: e.clientX, y: e.clientY }); }}
            className={`absolute top-1 ${isMe ? 'left-1' : 'right-1'} opacity-0 group-hover:opacity-100 transition-opacity
              bg-[#182229] rounded-full p-0.5 text-[#8696a0] hover:text-white`}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M7 10l5 5 5-5z" /></svg>
          </button>
        </div>
      </div>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />}
    </>
  );
};

// ─── ChatInput ────────────────────────────────────────────────────────────────
const ChatInput: React.FC<{ conversationId: string }> = ({ conversationId }) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      getSocket()?.emit('message:send', { conversationId, text: trimmed });
      setText('');
      setShowEmoji(false);
      emitTypingStop(conversationId);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) { console.error('Send failed', err); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
    emitTypingStart(conversationId);
    // if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    // typingTimerRef.current = setTimeout(() => emitTypingStop(conversationId), 2000);
  };

  return (
    <div className="bg-[#202c33] px-4 py-3 relative flex-shrink-0">
      {showEmoji && <EmojiPicker onSelect={(e) => setText((t) => t + e)} onClose={() => setShowEmoji(false)} />}
      <div className="flex items-end gap-2">
        <button onClick={() => setShowEmoji(v => !v)} className={`p-1 flex-shrink-0 mb-1 transition-colors ${showEmoji ? 'text-[#00a884]' : 'text-[#8696a0] hover:text-[#e9edef]'}`}>
          <EmojiIcon />
        </button>
        <button className="p-1 flex-shrink-0 mb-1 text-[#8696a0] hover:text-[#e9edef] transition-colors"><AttachIcon /></button>
        <div className="flex-1 bg-[#2a3942] rounded-2xl px-4 py-2 min-h-[42px] flex items-center">
          <textarea ref={textareaRef} value={text} onChange={handleChange} onKeyDown={handleKeyDown}
            placeholder="Type a message" rows={1}
            className="w-full bg-transparent text-[#e9edef] text-sm placeholder-[#8696a0] resize-none outline-none leading-5 max-h-32 overflow-y-auto" />
        </div>
        <button onClick={handleSend}
          className={`flex-shrink-0 mb-1 p-2.5 rounded-full transition-all ${text.trim() ? 'bg-[#00a884] text-white hover:bg-[#06cf9c]' : 'text-[#8696a0] hover:text-[#e9edef]'}`}>
          {text.trim() ? <SendIcon /> : <MicIcon />}
        </button>
      </div>
    </div>
  );
};

// ─── ContactInfoPanel ─────────────────────────────────────────────────────────
const ContactInfoPanel: React.FC<{ user: User; isGroup: boolean; conversation: any }> = ({
  user, isGroup, conversation,
}) => {
  const dispatch = useAppDispatch();
  return (
    <div className="w-80 bg-[#111b21] border-l border-[#2a3942] flex flex-col overflow-hidden flex-shrink-0">
      <div className="flex items-center gap-4 px-4 py-4 bg-[#202c33]">
        <button onClick={() => dispatch(toggleContactInfo())} className="text-[#aebac1] hover:text-white transition-colors">
          <CloseIcon />
        </button>
        <h3 className="text-[#e9edef] font-medium">{isGroup ? 'Group info' : 'Contact info'}</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="bg-[#111b21] flex flex-col items-center py-8 gap-3">
          <Avatar user={user} size="xl" showOnline={!isGroup} />
          <div className="text-center">
            <h2 className="text-[#e9edef] text-xl font-medium">{user.name}</h2>
            <p className="text-[#8696a0] text-sm mt-1">
              {isGroup ? `${conversation.participants?.length} members` : user.isOnline ? 'online' : 'offline'}
            </p>
          </div>
        </div>
        <div className="bg-[#202c33] p-4 mb-2">
          <p className="text-[#00a884] text-sm font-medium mb-1">About</p>
          <p className="text-[#e9edef] text-sm">{user.status || 'Hey there! I am using WhatsApp.'}</p>
        </div>
        {!isGroup && (
          <div className="bg-[#202c33] p-4 mb-2">
            <button className="w-full text-left text-red-400 text-sm hover:text-red-300 transition-colors">
              Block {user.name}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── EmptyState ────────────────────────────────────────────────────────────────
const EmptyState: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center bg-[#222e35] select-none">
    <div className="flex flex-col items-center gap-6 max-w-sm text-center px-8">
      <div className="w-48 h-48 rounded-full bg-[#182229] flex items-center justify-center">
        <svg viewBox="0 0 212 212" className="w-32 h-32 opacity-20" fill="#00a884">
          <path d="M106.001 0C47.503 0 0 47.504 0 106.001c0 19.063 5.07 37.003 13.9 52.502L0 212l55.211-14.498c14.952 8.072 32.12 12.721 50.403 12.721C164.5 210.223 212 162.718 212 104.221 212 45.724 164.5 0 106.001 0zm.001 193.223c-16.671 0-32.242-4.564-45.63-12.496l-3.265-1.936-33.784 8.87 8.982-32.81-2.12-3.365C22.58 138.53 18 122.72 18 106.001 18 57.422 57.422 18 106.001 18 154.581 18 194 57.422 194 106.001c0 48.579-39.419 87.222-87.999 87.222z"/>
        </svg>
      </div>
      <div>
        <h2 className="text-[#e9edef] text-2xl font-light mb-2">WhatsApp Web</h2>
        <p className="text-[#8696a0] text-sm leading-relaxed">Send and receive messages without keeping your phone online. Select a conversation to start chatting.</p>
      </div>
      <div className="flex items-center gap-2 text-[#8696a0] text-xs border-t border-[#2a3942] pt-4 w-full justify-center">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" /></svg>
        Your personal messages are end-to-end encrypted
      </div>
    </div>
  </div>
);

export default ChatWindow;
