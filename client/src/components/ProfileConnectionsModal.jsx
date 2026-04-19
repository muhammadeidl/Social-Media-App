import React from "react";
import { X, MessageSquare, UserMinus, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";

const ProfileConnectionsModal = ({ 
  title, 
  data = [], 
  onClose, 
  isMyProfile, 
  refreshData 
}) => {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const handleUnfollow = async (userId) => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/user/unfollow",
        { id: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success(data.message);
        refreshData && refreshData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.message || "Unfollow failed");
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 flex-1 space-y-4">
          {data.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No {title.toLowerCase()} found.
            </div>
          ) : (
            data.map((user) => (
              user && (
              <div key={user._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={user.profile_picture || "https://via.placeholder.com/150"}
                  alt={user.full_name}
                  className="w-12 h-12 rounded-full object-cover border border-gray-200"
                />
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{user.full_name}</h3>
                  <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                        navigate(`/profile/${user._id}`);
                        onClose();
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                  >
                    View
                  </button>

                  {isMyProfile && title === "Following" && (
                    <button
                      onClick={() => handleUnfollow(user._id)}
                      className="p-1.5 text-gray-600 bg-gray-200 rounded-lg hover:bg-red-100 hover:text-red-600 transition"
                      title="Unfollow"
                    >
                      <UserMinus className="w-5 h-5" />
                    </button>
                  )}


                  
                  {isMyProfile && title === "Connections" && (
                     <button
                        onClick={() => {
                           navigate(`/messages/${user._id}`);
                           onClose();
                        }}
                        className="p-1.5 text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition"
                        title="Message"
                     >
                        <MessageSquare className="w-5 h-5" />
                     </button>
                  )}
                </div>
              </div>
              )
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileConnectionsModal;
