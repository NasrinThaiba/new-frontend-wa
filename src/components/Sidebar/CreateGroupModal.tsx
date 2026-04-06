import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { createGroup } from "../../store/slices/chatSlice";
import { Avatar } from "../Common";

interface CreateGroupModalProps {
  onClose: () => void; // <-- parent will pass this
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector((s) => s.auth.user?._id);
  const conversations = useAppSelector((s) => s.chat.conversations);
  const blockedUsers = useAppSelector((s) => s.blockedUsers.blockedUsers || []);

  // Get unique contacts (excluding self & blocked users)
  const contacts = Array.from(
    new Map(
      conversations
        .flatMap((c) => c.participants)
        .filter((u) => u._id !== currentUserId && !blockedUsers.some((b) => b._id === u._id))
        .map((u) => [u._id, u])
    ).values()
  );

  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    await dispatch(createGroup({ name: groupName, participants: selectedUsers }));

    // Clear state & close modal
    setGroupName("");
    setSelectedUsers([]);
    onClose();
  };

return (
  <div className="p-5 relative bg-[#111b21] rounded-2xl w-[400px] shadow-2xl border border-[#202c33]">

    <button
      onClick={() => {
        setGroupName("");
        setSelectedUsers([]);
        onClose();
      }}
      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-[#202c33] hover:bg-[#2a3942] text-gray-300 hover:text-white transition"
    >
      ✕
    </button>

   
    <h2 className="text-white text-lg font-semibold mb-4"> Create Group </h2>

    <input
      placeholder="Enter group name"
      value={groupName}
      onChange={(e) => setGroupName(e.target.value)}
      className="w-full px-4 py-2 mb-4 bg-[#202c33] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#00a884] placeholder:text-[#8696a0]"
    />

    <p className="text-[#8696a0] text-xs mb-2 uppercase tracking-wide"> Select contacts </p>

    <div className="max-h-64 overflow-y-auto mb-4 pr-1 space-y-1 scrollbar-thin scrollbar-thumb-[#2a3942]">
      {contacts.map((contact) => {
        const isSelected = selectedUsers.includes(contact._id);

        return (
          <button
            key={contact._id}
            onClick={() => toggleUser(contact._id)}
            className={`flex items-center gap-3 px-3 py-2 w-full rounded-xl transition-all duration-150 ${ isSelected ? "bg-[#00a884]/20" : "hover:bg-[#202c33]"}`}
          >
            <Avatar user={contact} size="sm" />
            <span className="text-white flex-1 text-left"> {contact.name} </span>

            {/* Checkbox indicator */}
            <div className={`w-4 h-4 rounded border ${ isSelected ? "bg-[#00a884] border-[#00a884]" : "border-[#8696a0]" }`} />
          </button>
        );
      })}
    </div>

    {/* Create Button */}
    <button
      onClick={handleCreate}
      disabled={!groupName || selectedUsers.length === 0}
      className={`w-full py-2.5 rounded-lg font-medium transition-all duration-200 ${
        groupName && selectedUsers.length > 0
          ? "bg-[#00a884] hover:bg-[#06cf9c]"
          : "bg-[#2a3942] text-[#8696a0] cursor-not-allowed"
      } text-white`}
    >
      Create Group
    </button>
  </div>
);
};

export default CreateGroupModal;