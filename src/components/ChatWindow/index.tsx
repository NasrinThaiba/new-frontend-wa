import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { fetchMessages, removeUserFromGroup } from '../../store/slices/chatSlice';
import { toggleContactInfo } from '../../store/slices/uiSlice';
import { emitTypingStart, emitTypingStop, emitMessageRead, getSocket} from '../../services/socket';
import api from '../../services/api';
import { Avatar, EmojiPicker, ContextMenu, type ContextMenuItem, MessageTicks } from '../Common';
import { VideoIcon, PhoneIcon, SearchIcon, MoreIcon, EmojiIcon, AttachIcon, SendIcon, MicIcon, CloseIcon } from '../Common/Icons';
import { type Message, type User } from '../../types';
import { blockUser, unblockUser, fetchBlockedUsers } from '../../store/slices/userSlice';
import AddParticipantsModal from "../../components/Sidebar/AddParticipantsModal"


//  ChatWindow 
const ChatWindow: React.FC = () => {
  const { activeConversationId, conversations } = useAppSelector((s) => s.chat);
  const { showContactInfo } = useAppSelector((s) => s.ui);
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchBlockedUsers()); 
  }, [dispatch]);

  if (!activeConversationId) return <EmptyState />;
  
  const conversation = conversations.find((c) => c._id === activeConversationId);
  if (!conversation) return <EmptyState />;

 const otherParticipant = conversation.participants?.find(
  (p: User) => p._id !== user?._id
);

const displayUser: User = conversation.isGroup
  ? {
      _id: conversation._id,
      name: conversation.groupName ?? 'Group',
      phone: '',
      email: "",
      status: '',
      isOnline: false,
      avatar: conversation.groupAvatar
    }
  : {
      _id: otherParticipant?._id || 'unknown',
      name: otherParticipant?.name || 'Unknown',
      phone: otherParticipant?.phone || '',
      email: otherParticipant?.email || "",
      status: otherParticipant?.status || '',
      isOnline: otherParticipant?.isOnline || false,
      avatar: otherParticipant?.avatar || ""
    };

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



//  ChatHeader 
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
    <div className="flex items-center justify-between px-4 py-3 bg-[#202c33] border-b border-[#2a3942] flex-shrink-0 gap-3">
      <button className="flex items-center gap-3 text-left min-w-0 flex-1" onClick={() => dispatch(toggleContactInfo())}>
        <Avatar user={displayUser} showOnline={!isGroup} />
        <div className="space-y-1">
          <h3 className="text-[#e9edef] text-sm font-medium truncate">{displayUser.name}</h3>
          <p className={`text-xs truncate  ${typingNames.length > 0 ? 'text-[#00a884]' : 'text-[#8696a0]'}`}>{subtitle}</p>
        </div>
      </button>
      <div className="flex items-center gap-1 flex-shrink-0">
        {[{ icon: <VideoIcon />, label: 'Video' }, { icon: <PhoneIcon />, label: 'Call' }, { icon: <SearchIcon />, label: 'Search' }, { icon: <MoreIcon />, label: 'More' }].map((b) => (
          <button key={b.label} title={b.label} className="p-2 text-[#aebac1] hover:text-white rounded-full transition-colors">{b.icon}</button>
        ))}
      </div>
    </div>
  );
};

//  MessageList 
const MessageList: React.FC<{ conversationId: string; currentUserId?: string }> = ({
  conversationId, currentUserId,
}) => {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((s) => s.chat.messages[conversationId] ?? []);
  const typingUsers = useAppSelector((s) => s.chat.typingUsers[conversationId] ?? {});
  const isLoading = useAppSelector((s) => s.chat.isLoadingMessages);
  const endRef = useRef<HTMLDivElement>(null);
  const { conversations } = useAppSelector(s => s.chat);
  const { user } = useAppSelector(s => s.auth);
  const blockedUsers = useAppSelector(s => s.blockedUsers.blockedUsers);

  const conversation = conversations.find(c => c._id === conversationId);
  const otherUserId = conversation?.participants.find((p : User) => p._id !== user?._id)?._id;
  const isBlocked = (blockedUsers || []).some(u => u._id === otherUserId);

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

  if (isBlocked) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#8696a0]">
        You blocked this user. Messages are hidden.
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

        <div ref={endRef} />
      </div>
    </div>
  );
};

//  MessageBubble 
const MessageBubble: React.FC<{ message: Message; isMe: boolean; conversationId: string }> = ({
  message, isMe, conversationId,
}) => {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const handleDelete = async (deleteFor: 'me' | 'everyone') => {
    try {
      await api.delete(`/messages/${message._id}`, { data: { deleteFor } });
      getSocket()?.emit('message:delete', { messageId: message._id, conversationId });
    } catch (err) { console.error('Delete failed', err); }
  };

  const menuItems: ContextMenuItem[] = [
    ...(isMe ? [{ label: 'Delete for everyone', action: () => handleDelete('everyone'), danger: true }] : []),
    { label: 'Delete for me', action: () => handleDelete('me'), danger: true },
  ];

  const senderName = typeof message.sender === 'string' ? '' : (message.sender as User).name;
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1 group`}>
        <div className={`relative max-w-xs lg:max-w-md xl:max-w-lg ${isMe ? 'order-2' : 'order-1'}`}> 
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

//  ChatInput 
const ChatInput: React.FC<{ conversationId: string }> = ({ conversationId }) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { conversations } = useAppSelector(s => s.chat);
  const { user } = useAppSelector(s => s.auth);
  const blockedUsers = useAppSelector(s => s.blockedUsers.blockedUsers);

  const conversation = conversations.find(c => c._id === conversationId);
  const otherUserId = conversation?.participants.find(p => p._id !== user?._id)?._id;
  const isBlocked = (blockedUsers || []).some(u => u._id === otherUserId);

  const handleSend = async () => {
    if (isBlocked) return; // 🚫 block send
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      getSocket()?.emit('message:send', { conversationId, text: trimmed });
      setText('');
      setShowEmoji(false);
      emitTypingStop(conversationId);

      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      console.error('Send failed', err);
    }
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
  };

return (
  <div className="bg-[#202c33] px-4 py-3 relative flex-shrink-0">
    
    {isBlocked && (
      <div className="text-center text-red-400 text-sm mb-2">
        You blocked this user. Unblock to send messages.
      </div>
    )}

    {showEmoji && (
      <EmojiPicker onSelect={(e) => setText((t) => t + e)}  onClose={() => setShowEmoji(false)}/>
    )}
    <div className="flex items-end gap-2">

      <button onClick={() => setShowEmoji(v => !v)} disabled={isBlocked} className={`p-1 mb-1 ${ isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <EmojiIcon className="w-5 h-5 text-[#e9edef]" />
      </button>

      <button disabled={isBlocked} className={`p-1 mb-1 ${ isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <AttachIcon className="w-5 h-5 text-[#e9edef]" />
      </button>

      <div className="flex-1 bg-[#2a3942] rounded-2xl px-4 py-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isBlocked}   
          placeholder="Type a message"
          rows={1}
          className="w-full bg-transparent text-[#e9edef] text-sm outline-none resize-none"
        />
      </div>

    
      <button
        onClick={handleSend} disabled={isBlocked || !text.trim()}  
        className={`p-2.5 rounded-full transition-all ${isBlocked ? 'bg-gray-500 cursor-not-allowed' : text.trim() ? 'bg-[#00a884] hover:bg-[#06cf9c]' : 'text-[#8696a0]'} text-white`}
      >
        {text.trim() ? <SendIcon /> : <MicIcon />}
      </button>

    </div>
  </div>
);
};

//  ContactInfoPanel 
const ContactInfoPanel: React.FC<{ user: User; isGroup: boolean; conversation: any }> = ({ user, isGroup, conversation}) => {
  const dispatch = useAppDispatch();

  const blockedUsers = useAppSelector(s => s.blockedUsers.blockedUsers);
  const currentUserId = useAppSelector(s => s.auth.user?._id);
  const [showAddModal, setShowAddModal] = useState(false);
  const isBlocked = (blockedUsers || []).some(u => u._id === user._id);
  const isAdmin = conversation.groupAdmin === currentUserId;

  const handleBlock = () => {
    dispatch(blockUser(user._id));
  };

  const handleUnblock = () => {
    dispatch(unblockUser(user._id));
  };

  const handleToggle = () => {
    if (isBlocked) handleUnblock();
    else handleBlock();
  };

  const handleRemoveFromGroup = (participantId: string) => {
    console.log("REMOVE:", {
      groupId: conversation._id,
      userId: participantId,
    });

    dispatch(removeUserFromGroup({
      groupId: conversation._id,
      userId: participantId,
    }));
  };


  return (
    <div className="w-80 bg-[#111b21] border-l border-[#2a3942] flex flex-col overflow-hidden flex-shrink-0">
    
      <div className="flex items-center gap-4 px-4 py-4 bg-[#202c33]">
        <button
          onClick={() => dispatch(toggleContactInfo())}
          className="text-[#aebac1] hover:text-white transition-colors"
        >
          <CloseIcon />
        </button>
        <h3 className="text-[#e9edef] font-medium">
          {isGroup ? 'Group info' : 'Contact info'}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-[#111b21] flex flex-col items-center py-8 gap-3">
          <Avatar user={user} size="xl" showOnline={!isGroup} />
          <div className="text-center">
            <h2 className="text-[#e9edef] text-xl font-medium">{user.name}</h2>
            <p className="text-[#8696a0] text-sm mt-1">
              {isGroup
                ? `${conversation.participants?.length || 0} members`
                : user.isOnline
                ? 'online'
                : 'offline'}
            </p>
          </div>
        </div>

        
        <div className="bg-[#202c33] p-4 mb-2">
          <p className="text-[#00a884] text-sm font-medium mb-1">About</p>
          <p className="text-[#e9edef] text-sm">
            {user.status || 'Hey there! I am using WhatsApp.'}
          </p>
        </div>

        {!isGroup && (
          <div className="bg-[#202c33] p-4 mb-2">
            <button
              onClick={handleToggle}
              className="w-full text-left text-red-400 text-sm hover:text-red-300 transition-colors"
            >
              {isBlocked ? `Unblock ${user.name}` : `Block ${user.name}`}
            </button>
          </div>
        )}

        {isGroup && (
          <div className="bg-[#202c33] p-4 mb-2 flex flex-col gap-2">
            <p className="text-[#00a884] text-sm font-medium mb-2">
              Participants
            </p>
            
            {isAdmin && (
               <button
               onClick={() => setShowAddModal(true)}
               className="bg-[#00a884] px-3 py-2 my-2 text-xs rounded text-white">
                 Add Participants
                 </button>
                )}

            {conversation.participants?.map((participant: User) => {
              if (!participant?._id) return null;
              const isSelf = participant._id === currentUserId;

              return (
                <div
                  key={participant._id}
                  className="flex items-center justify-between bg-[#111b21] px-3 py-2 rounded"
                >
                  <div className="flex items-center gap-2">
                    <Avatar user={participant} size="sm" />
                    <span className="text-[#e9edef] text-sm">
                      {participant.name}
                      {isSelf && " (You)"}
                    </span>
                  </div>

                  
                  {(isAdmin || isSelf) && (
                    <button
                      onClick={() => handleRemoveFromGroup(participant._id)}
                      className="text-red-400 text-xs hover:text-red-300 transition-colors"
                    >
                      {isSelf ? "Leave" : "Remove"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <AddParticipantsModal
            onClose={() => setShowAddModal(false)}
            groupId={conversation._id}
            participants={conversation.participants || []} 
            />
            </div>
          )}
      </div>
    </div>
  );
};

//  EmptyState 
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
