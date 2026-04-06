import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { addUserToGroup } from "../../store/slices/chatSlice";
import { Avatar } from "../Common";
import { type AddParticipantsModalProps } from "../../types";


const AddParticipantsModal: React.FC<AddParticipantsModalProps> = ({ onClose, groupId, participants}) => {
  const dispatch = useAppDispatch();

  const conversations = useAppSelector((s) => s.chat.conversations);
  const blockedUsers = useAppSelector((s) => s.blockedUsers.blockedUsers || []);

  const contacts = Array.from(
    new Map(
      conversations
        .flatMap((c) => c.participants)
        .filter(
          (u) =>
            !blockedUsers.some((b) => b._id === u._id) &&
            !participants?.some((p) => p._id === u._id) // ❗ exclude already in group
        )
        .map((u) => [u._id, u])
    ).values()
  );

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) =>prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    //if user already selected - remove, if not selected - add
    );
  };

  const handleAdd = async () => {
    if (selectedUsers.length === 0) return;
    selectedUsers.forEach(id => { dispatch(addUserToGroup({groupId, userId: id}) )});

    setSelectedUsers([]);
    onClose();
  };

  return (
    <div className="p-4 relative bg-[#111b21] rounded-lg w-[400px]">
      
      <button
        onClick={() => {
          setSelectedUsers([]);
          onClose();
        }}
        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-[#202c33] hover:bg-[#2a3942] text-white" 
        >
        ✕
      </button>

      <h2 className="text-white text-lg mb-3">Add Participants</h2>
      <p className="text-[#8696a0] text-sm mb-2">Select contacts</p>
      <div className="max-h-64 overflow-y-auto mb-3">
        {contacts.length === 0 && ( <p className="text-gray-400 text-sm">No users available</p> )}

        {contacts.map((contact) => (
          <button
            key={contact._id}
            onClick={() => toggleUser(contact._id)}
            className={`flex items-center gap-3 px-2 py-1 w-full rounded hover:bg-[#202c33] ${
              selectedUsers.includes(contact._id) ? "bg-[#2a3942]" : "" }`}
          >
            <Avatar user={contact} size="sm" />
            <span className="text-white">{contact.name}</span>
          </button>
        ))}
      </div>


      <button onClick={handleAdd}
        disabled={selectedUsers.length === 0}
        className={`w-full py-2 rounded ${ selectedUsers.length > 0 ? "bg-green-500" : "bg-gray-600 cursor-not-allowed"} text-white`}
      >
        Add Participants
      </button>
    </div>
  );
};

export default AddParticipantsModal;
