import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { fetchBlockedUsers, unblockUser } from "../../store/slices/userSlice";

const BlockedUsersModal = () => {
  const dispatch = useAppDispatch();

  const blockedUsers = useAppSelector((s) => s.blockedUsers.blockedUsers);
  useEffect(() => { dispatch(fetchBlockedUsers())}, [dispatch]);

  return (
    <div className="p-4">
      <h2 className="text-white mb-3">Blocked Users</h2>

      {blockedUsers.map((user) => (
        <div key={user._id} className="flex justify-between py-2">
          <span className="text-white">{user.name}</span>

          <button
            onClick={() => dispatch(unblockUser(user._id))}
            className="text-green-400"
          >
            Unblock
          </button>
        </div>
      ))}
    </div>
  );
};

export default BlockedUsersModal;