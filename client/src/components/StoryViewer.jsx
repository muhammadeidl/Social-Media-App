import { useEffect, useState } from "react";
import { X, BadgeCheck, Trash2, Loader2 } from "lucide-react"; 
import { useSelector } from "react-redux";
import api from "../api/axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const StoryViewer = ({ viewStory, setViewStory }) => {
  const { getToken } = useAuth();
  const currentUser = useSelector((state) => state.user.value);

  const handleClose = () => {
    setViewStory(null);
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
        const { data } = await api.post(
            "/api/story/delete",
            { storyId: viewStory._id },
            { headers: { Authorization: `Bearer ${await getToken()}` } }
        );

        if (data.success) {
            toast.success("Story deleted");
            handleClose();
            window.location.reload(); // Simple refresh to update story bar
        } else {
            toast.error(data.message);
        }

    } catch (error) {
        toast.error(error.message);
    } finally {
        setIsDeleting(false);
    }
  };

  const renderContent = () => {
    switch (viewStory.media_type) {
      case "image":
        return (
          <img
            src={viewStory.media_url} className="max-w-full max-h-screen object-contain"
          />
        );

      case "video":
        return (
          <video src={viewStory.media_url} onEnded={() => setViewStory(null)}
            controls autoPlay className="max-h-screen"
          />
        );
        case "text":
         return (
             <div className="w-full h-full flex items-center justify-center p-8 text-white text-2xl text-center">
             {viewStory.content}
            </div>
        );

      default:
        return null;
    }
  };
   const [progress, setProgress] = useState(0);

useEffect(() => {
  let timer, progressInterval;

  if (viewStory && viewStory.media_type !== "video" && !showDeleteModal) {
    setProgress(0);
    const duration = 10000;
    const setTime = 100;
    let elapsed = 0;

    progressInterval = setInterval(() => {
      elapsed += setTime;
      setProgress((elapsed / duration) * 100);
    }, setTime);

    timer = setTimeout(() => {
      setViewStory(null);
    }, duration);
  }

  return () => {
    clearTimeout(timer);
    clearInterval(progressInterval);
  }
}, [viewStory, setViewStory, showDeleteModal])

return (
  <div
    className="fixed inset-0 h-screen bg-black bg-opacity-90 z-110 flex items-center justify-center"
    style={{
      backgroundColor:
        viewStory.media_type === "text"
          ? viewStory.background_color
          : "#000000",
    }}
  >
    {/* Progress Bar */}
    <div className="absolute top-0 left-0 w-full h-1 bg-gray-700">
      <div
        className="h-full bg-white transition-all duration-100 linear"
        style={{ width: `${progress}%` }}
      ></div>
    </div>

    {/* User Info */}
    <div className="absolute top-4 left-4 flex items-center space-x-3 p-2 px-4 sm:p-4 sm:px-8 backdrop-blur-2xl rounded bg-black/50">
      <img
        src={viewStory.user?.profile_picture}
        alt=""
        className="size-7 sm:size-8 rounded-full object-cover border border-white"
      />
      <div className="text-white font-medium flex items-center gap-1.5">
        <span>{viewStory.user?.full_name}</span>
      </div>
    </div>

    {/* Delete Button (Owner only) */}
    {currentUser?._id === viewStory.user?._id && (
        <button
            onClick={() => setShowDeleteModal(true)}
            className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 bg-black/50 p-3 rounded-full hover:bg-red-600 transition"
        >
            <Trash2 className="w-6 h-6 text-white" />
        </button>
    )}

    {/* Close button */}
    <button
  onClick={handleClose}
  className="absolute top-4 right-4 text-white text-3xl font-bold focus:outline-none">
  <X className="w-8 h-8 hover:scale-110 transition cursor-pointer" />
    </button>

    <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
    {renderContent()}
    </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
          {showDeleteModal && (
              <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                 onClick={(e) => e.stopPropagation()}
              >
                  <motion.div 
                     initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                     className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 p-6 text-center"
                  >
                     <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8 text-red-600 dark:text-red-500" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Story?</h3>
                     <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                        Are you sure you want to delete this story? This action cannot be undone.
                     </p>
                     
                     <div className="flex gap-3 w-full">
                         <button 
                            onClick={() => setShowDeleteModal(false)}
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
)

};

export default StoryViewer;
