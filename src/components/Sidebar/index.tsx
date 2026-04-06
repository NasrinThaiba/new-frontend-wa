import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { fetchConversations, setActiveConversation, setSearchQuery, createConversation, deleteConversation,} from "../../store/slices/chatSlice";
import { fetchBlockedUsers } from "../../store/slices/userSlice";
import { logoutUser } from "../../store/slices/authSlice";
import { toggleSettings, toggleCreateGroup} from "../../store/slices/uiSlice";
import { joinConversation } from "../../services/socket";
import { Avatar, MessageTicks, ContextMenu,type ContextMenuItem} from "../Common";
import { SearchIcon, MoreIcon, CloseIcon } from "../Common/Icons";
import { type Conversation, type User } from "../../types";
import api from "../../services/api";
import { unblockUser } from "../../store/slices/userSlice";
import CreateGroupModal from "./CreateGroupModal";

// SIDEBAR 
const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();

  const { conversations, activeConversationId, searchQuery, isLoadingConversations } =
    useAppSelector((s) => s.chat);

  const { user } = useAppSelector((s) => s.auth);
  const blockedUsers = useAppSelector(s => s.blockedUsers.blockedUsers || []);

  const [userResults, setUserResults] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const ui = useAppSelector(s => s.ui);


  useEffect(() => {
    dispatch(fetchConversations());
    dispatch(fetchBlockedUsers());
  }, [dispatch]);

 
  useEffect(() => {
    if (!searchQuery.trim()) {
      setUserResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
        const filtered = res.data.users.filter(
          (u: User) => !(blockedUsers || []).some((b) => b._id === u._id)
        );
        setUserResults(filtered);
      } catch {
        setUserResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery]);


  // FILTER CHATS
    const filteredChats = conversations.filter((conv) => {
    const otherUser = conv.participants.find((p) => p._id !== user?._id);

    const isBlocked = (blockedUsers || []).some((u) => u._id === otherUser?._id);
    if (isBlocked) return false;

    if (!searchQuery) return true;

    const name = getConvName(conv, user?._id);

    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherUser?.phone?.includes(searchQuery)
    );
  });

  return (
    <div className="w-[380px] flex-shrink-0 bg-[#111b21] flex flex-col border-r border-[#2a3942] overflow-hidden">
      <SidebarHeader />
      <SearchBar />

      <div className="flex-1 overflow-y-auto">

        {searchQuery && (
        <div className="w-full">
          <p className="px-4 py-2 text-xs text-[#8696a0]">Contacts</p>

          {isSearchingUsers ? (
            <div className="px-4 py-2 text-sm text-[#8696a0]">Searching...</div>
            ) : userResults.length === 0 ? (
            <div className="px-4 py-2 text-sm text-[#8696a0]">No users found</div>
            ) : (
            userResults.map((u) => (
              <button key={u._id} onClick={async () => {
                    const conv = await dispatch(createConversation(u._id)).unwrap();
                      dispatch(setActiveConversation(conv._id));
                      dispatch(setSearchQuery(""));
                  }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] transition w-full text-left" >

             <Avatar user={u} showOnline />
                <div>
                  <p className="text-[#e9edef] text-sm">{u.name}</p>
                  <p className="text-[#8696a0] text-xs">{u.phone}</p>
                </div>
              </button>
             ))
           )}
          </div>
        )}

        {/* CHATS */}
        <p className="px-4 py-2 text-md text-[#8696a0]">Chats</p>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#00a884]/60 scrollbar-track-[#111b21]">
          {isLoadingConversations ? (
          <div className="flex justify-center py-6 text-[#8696a0]">Loading chats...</div>
          ) : filteredChats.length === 0 ? (
          <div className="px-4 py-2 text-sm text-[#8696a0]">
          {searchQuery ? "No chats found" : "No conversations yet"}
        </div>
       ) : (
         filteredChats.map((conv) => (
            <ConversationItem
                key={conv._id}
                conversation={conv}
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

        <hr className="border-t border-[#2a2f32] my-2" />

         {/* BLOCKED USERS */}
        <p className="px-4 py-2 text-md text-[#8696a0]">Blocked Users</p>
        {blockedUsers.length === 0 && (
          <div className="px-4 py-2 text-sm text-[#8696a0]">No blocked users</div>
        )}
       
        {blockedUsers.map(bUser => (
          <div key={bUser._id} className="flex items-center justify-between px-4 py-2 bg-[#202c33] rounded mb-2 text-white">
            <div className="flex items-center gap-3">
              <Avatar user={bUser} size="sm" />
              <span>{bUser.name}</span>
            </div>
            <button
              onClick={() => dispatch(unblockUser(bUser._id))}
              className="text-red-400 hover:text-red-300 text-sm">
              Unblock
            </button>
          </div>
        ))}
      </div>

     {ui.showCreateGroup && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <CreateGroupModal
        onClose={() => dispatch(toggleCreateGroup())}
       />
     </div>
     )}
    </div>
  );
};

export default Sidebar;

// HEADER 
const SidebarHeader: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [showMenu, setShowMenu] = useState(false);

  const menuItems: ContextMenuItem[] = [
    { label: "Create Group", action: () => dispatch(toggleCreateGroup()) },
    { label: "Settings", action: () => dispatch(toggleSettings()) },
    { label: "Log out", action: () => dispatch(logoutUser()), danger: true },
  ];

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#202c33] border-b border-[#2a3942] flex-shrink-0">
      <div className="flex items-center gap-3">
        <Avatar user={user} size="md" />
        <span className="text-white font-medium text-md">{user?.name || "Unknown"}</span>
     </div>

      <div className="relative">
        <button onClick={() => setShowMenu((v) => !v)}
          className="p-2 text-[#aebac1] hover:text-white rounded-full transition-colors">
          <MoreIcon />
        </button>

        {showMenu && (
          <div className="absolute top-10 right-0 z-50 bg-[#233138] rounded-xl shadow-2xl py-2 min-w-44 border border-[#2a3942]">
            {menuItems.map((item, i) => (
              <button key={i} onClick={() => {
                  item.action();
                  setShowMenu(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#2a3942] ${
                  item.danger ? "text-red-400" : "text-white"
                } hover:bg-[#2a3942]`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// SEARCH 
const SearchBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const query = useAppSelector((s) => s.chat.searchQuery);

  return (
    <div className="my-1 px-3 py-2 bg-[#111b21] flex-shrink-0">
      <div className="flex items-center gap-2 bg-[#202c33] px-3 py-2 rounded-xl">
        <SearchIcon className="w-5 h-5 text-[#aebac1]"/>

        <input
          value={query}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          placeholder="Search users or chats"
          className="bg-transparent text-[#e9edef] text-sm placeholder-[#8696a0] outline-none flex-1"
        />

        {query && (
          <button onClick={() => dispatch(setSearchQuery(""))} className="text-[#aebac1] hover:text-white" >
            <CloseIcon className="w-4 h-4"/>
          </button>
        )}
      </div>
    </div>
  );
};

//  CONVERSATION 
const ConversationItem: React.FC<{conversation: Conversation; isActive: boolean;currentUserId?: string; onClick: () => void; }> =  ({
  conversation, isActive, currentUserId, onClick }) => {

  const dispatch = useAppDispatch();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const other = conversation.participants?.find(
    (p) => p._id !== currentUserId
  );

  const displayUser: User = conversation.isGroup
    ? {
        _id: conversation._id,
        name: conversation.groupName || "Group",
        email: "",
        phone: "",
        status: "",
        isOnline: false,
        avatar: conversation.groupAvatar,
      }
    : other ?? {
        _id: '',
        name: 'Unknown',
        email: '',
        phone: '',
        status: '',
        isOnline: false,
        avatar: '',
      };

  const name = displayUser.name;
  const lastMsg = conversation.lastMessage;
  const isMe = lastMsg && typeof lastMsg.sender !== "string" && lastMsg.sender?._id === currentUserId;
  const menuItems: ContextMenuItem[] = [
    {
      label: "Delete chat",
      action: () => dispatch(deleteConversation(conversation._id)),
      danger: true,
    },
  ];

  return (
    <>
      <div
        onClick={onClick}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
        className={`flex items-center gap-3 px-3 py-3 cursor-pointer ${
          isActive ? "bg-[#2a3942]" : "hover:bg-[#202c33]"
        }`}
      >
        <Avatar user={displayUser} />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex justify-between items-center">
            <span className="text-white truncate">{name}</span>
            {lastMsg && (
              <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                {new Date(lastMsg.createdAt).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                  //hour12: false,
                })}
              </span>
            )}
          </div>

          {lastMsg && (
            <div className="flex items-center text-xs text-gray-400 truncate gap-1 mt-1">
              {isMe && <MessageTicks status={lastMsg.status} />}
              <span className="truncate">{lastMsg.text || "No messages"}</span>
            </div>
          )}
        </div>
      </div>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)}/>
      )}
    </>
  );
};
// HELPER 
const getConvName = (conv: Conversation, userId?: string) => {
  if (conv.isGroup) return conv.groupName || "Group";

  const other = conv.participants.find((p) => p._id !== userId);
  return other?.name || "Unknown";
};
