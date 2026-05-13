import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, X, Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const SendPostModal = ({ isOpen, onClose, postId }) => {
  const { followers, following } = useSelector((state) => state.connections);
  
  const connections = React.useMemo(() => {
    const all = [...(followers || []), ...(following || [])];
    return Array.from(new Map(all.map(u => [u._id, u])).values());
  }, [followers, following]);
  const { getToken } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sendingTo, setSendingTo] = useState(null);

  const filteredConnections = connections?.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async (userId) => {
    setSendingTo(userId);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("to_user_id", userId);
      formData.append("shared_post", postId);

      const { data } = await api.post("/api/message/send", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // using formdata because sendMessage controller expects it or at least parses it
        },
      });

      if (data.success) {
        toast.success("Post sent successfully");
        onClose();
      } else {
        toast.error(data.message || "Failed to send post");
      }
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    } finally {
      setSendingTo(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 w-full max-w-sm md:max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Send to</h3>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4 shrink-0 border-b border-gray-50 dark:border-slate-800/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none text-gray-800 dark:text-gray-100 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
              />
            </div>
          </div>

          {/* Connections List */}
          <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
            {filteredConnections?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">No connections found.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConnections?.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer group"
                    onClick={() => {
                       if (sendingTo !== user._id) handleSend(user._id);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.profile_picture}
                        alt={user.full_name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-slate-700 shadow-sm"
                      />
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {user.full_name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</p>
                      </div>
                    </div>
                    
                    <button
                      disabled={sendingTo === user._id}
                      className="p-2 rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-50"
                    >
                      {sendingTo === user._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 -ml-0.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SendPostModal;
