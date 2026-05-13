import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";
import { Trash2, Loader2, Send, Heart, Reply } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import moment from "moment";

export default function CommentsModal({ postId, postOwnerId, onClose, onCommentAdded, onCommentDeleted }) {
  const { getToken, userId } = useAuth();
  const currentUser = useSelector((state) => state.user.value);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/comment/${postId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) setComments(data.comments || []);
      else toast.error(data.message);

      setLoading(false);
    } catch (e) {
      setLoading(false);
      toast.error(e.message);
    }
  };

  const add = async () => {
    if (!text.trim()) return;

    try {
      const { data } = await api.post(
        "/api/comment/add",
        { postId, text, parentCommentId: replyingTo?.id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        setComments((prev) => [data.comment, ...prev]);
        setText("");
        setReplyingTo(null);
        onCommentAdded?.();
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const executeDelete = async () => {
    if (!deletingCommentId) return;
    setIsDeleting(true);
    try {
        const { data } = await api.post(
            "/api/comment/delete",
            { commentId: deletingCommentId },
            { headers: { Authorization: `Bearer ${await getToken()}` } }
        );

        if(data.success) {
            toast.success("Comment deleted");
            setComments(prev => prev.filter(c => c._id !== deletingCommentId));
            onCommentDeleted?.();
            setDeletingCommentId(null);
        } else {
            toast.error(data.message);
        }
    } catch (error) {
        toast.error(error.message);
    } finally {
        setIsDeleting(false);
    }
  }

  const handleLike = async (commentId) => {
    try {
      const { data } = await api.post(
        "/api/comment/like",
        { commentId },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId ? { ...c, likes: data.likes } : c
          )
        );
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    if (postId) fetchComments();
  }, [postId]);

  const topLevelComments = comments.filter((c) => !c.parentComment);
  const getReplies = (parentId) => comments.filter((c) => c.parentComment === parentId).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

  const renderComment = (c, isReply = false) => {
    const isLiked = Array.isArray(c.likes) && c.likes.includes(userId);
    return (
      <div key={c._id} className={`${isReply ? "ml-10 mt-3" : "mt-4"} flex gap-3 group`}>
        <img
          src={c.user?.profile_picture || ""}
          className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-700 object-cover shrink-0"
          alt=""
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
             <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {c.user?.full_name || "User"}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    @{c.user?.username || ""} • {moment(c.createdAt).fromNow()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{c.text}</p>
             </div>
             
             {/* Delete button logic */}
             {(userId === c.user?._id) && (
                 <button 
                      onClick={() => setDeletingCommentId(c._id)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer shrink-0"
                 >
                     <Trash2 className="w-4 h-4" />
                 </button>
             )}
          </div>
          
          <div className="flex items-center gap-4 mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
             <button 
                onClick={() => handleLike(c._id)}
                className={`flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer ${isLiked ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
             >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{c.likes?.length || 0}</span>
             </button>
             <button 
                onClick={() => setReplyingTo({ id: !isReply ? c._id : c.parentComment, name: c.user?.username })}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer flex items-center gap-1"
             >
                <Reply className="w-3.5 h-3.5" />
                Reply
             </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl p-5 border border-gray-100 dark:border-slate-800 relative">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">
          <h2 className="font-bold text-gray-900 dark:text-white">Comments</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition cursor-pointer">
            ✕
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar pb-4">
          {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>}

          {!loading && comments.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Be the first to comment!</p>
          )}

          {topLevelComments.map((c) => (
            <div key={c._id} className="border-b border-gray-50 dark:border-slate-800/50 pb-4">
              {renderComment(c, false)}
              {getReplies(c._id).map(reply => renderComment(reply, true))}
            </div>
          ))}
        </div>

        <div className="mt-2 pt-3 border-t border-gray-100 dark:border-slate-800">
          {replyingTo && (
            <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-t-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2">
              <span>Replying to @{replyingTo.name}</span>
              <button onClick={() => setReplyingTo(null)} className="hover:text-indigo-800 dark:hover:text-indigo-200 cursor-pointer">✕</button>
            </div>
          )}
          <div className="flex items-center gap-3">
             <img src={currentUser?.profile_picture} className="w-8 h-8 rounded-full object-cover" alt="" />
             <form onSubmit={(e) => { e.preventDefault(); add(); }} className="flex-1 relative">
                <input 
                   type="text" 
                   placeholder={replyingTo ? `Reply to @${replyingTo.name}...` : "Write a comment..."}
                   value={text}
                   onChange={(e) => setText(e.target.value)}
                   className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-2 pl-4 pr-10 text-sm text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
                <button 
                   type="submit" 
                   disabled={!text.trim()}
                   className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 disabled:opacity-50 transition p-1 cursor-pointer"
                >
                   <Send className="w-4 h-4" />
                </button>
             </form>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
          {deletingCommentId && (
              <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              >
                  <motion.div 
                     initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                     className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 p-6 text-center"
                  >
                     <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8 text-red-600 dark:text-red-500" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Comment?</h3>
                     <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                        Are you sure you want to delete this comment? This action cannot be undone.
                     </p>
                     
                     <div className="flex gap-3 w-full">
                         <button 
                            onClick={() => setDeletingCommentId(null)}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
                         >
                            Cancel
                         </button>
                         <button 
                            onClick={executeDelete}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition cursor-pointer flex items-center justify-center gap-2"
                         >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                         </button>
                     </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
