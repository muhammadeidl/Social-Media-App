import { Plus, MoreVertical, Trash2, Loader2 } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import StoryModal from "./StoryModal";
import StoryViewer from "./StoryViewer";
import { useAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import api from "../api/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const StoriesBar = () => {
  const [stories, setStories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewStory, setViewStory] = useState(null);
  
  const [showMenuForStory, setShowMenuForStory] = useState(null);
  const [storyToDelete, setStoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { getToken } = useAuth();
  const currentUser = useSelector((state) => state.user.value);

  const fetchStories = async () => {
    try {
      if (typeof getToken !== "function") return;

      const token = await getToken();
      if (!token) return;

      const { data } = await api.get("/api/story/get", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setStories(data.stories || []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setShowMenuForStory(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleDelete = async () => {
    if (!storyToDelete) return;
    setIsDeleting(true);
    try {
        const { data } = await api.post(
            "/api/story/delete",
            { storyId: storyToDelete },
            { headers: { Authorization: `Bearer ${await getToken()}` } }
        );

        if (data.success) {
            toast.success("Story deleted");
            setStories(prev => prev.filter(s => s._id !== storyToDelete));
            setStoryToDelete(null);
        } else {
            toast.error(data.message);
        }

    } catch (error) {
        toast.error(error.message);
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <div className="w-screen sm:w-[calc(100vw-240px)] lg:max-w-2xl overflow-x-auto px-4">
      <div className="flex gap-4 pb-5">
        <div
          onClick={() => setShowModal(true)}
          className="rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-w-30 max-w-30 max-h-40 aspect-3/4 cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 border-2 border-dashed border-indigo-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gradient-to-b from-indigo-50/50 dark:from-slate-800/50 to-white/80 dark:to-slate-900/80 backdrop-blur-sm flex items-center justify-center group"
        >
          <div className="flex flex-col items-center justify-center p-4">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-slate-800 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-600 rounded-full flex items-center justify-center mb-3 transition-colors">
              <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors" />
            </div>

            <p className="text-sm font-medium text-slate-700 dark:text-gray-300 text-center">
              Create story
            </p>
          </div>
        </div>

        {stories.map((story, index) => (
          <div
            onClick={() => setViewStory(story)}
            key={index}
            className="relative rounded-2xl shadow-md min-w-30 max-w-30 max-h-40 aspect-3/4 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-indigo-500 to-purple-600 active:scale-95 overflow-hidden group border border-white/20"
          >
            <div className="absolute top-3 left-3 z-20 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600 p-[2px] shadow-sm transform group-hover:scale-110 transition-transform duration-300">
              <img
                src={story?.user?.profile_picture}
                alt=""
                className="w-8 h-8 rounded-full border-2 border-white object-cover bg-white"
              />
            </div>

            {/* 3 Dots Menu for Owner */}
            {currentUser?._id === story.user?._id && (
                <div className="absolute top-2 right-2 z-30">
                    <button 
                       onClick={(e) => { 
                           e.stopPropagation(); 
                           setShowMenuForStory(showMenuForStory === story._id ? null : story._id); 
                       }}
                       className="text-white/90 hover:text-white p-1 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-sm transition cursor-pointer"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>
                    {showMenuForStory === story._id && (
                        <div 
                           onClick={(e) => e.stopPropagation()}
                           className="absolute top-8 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-1 min-w-[120px] overflow-hidden"
                        >
                            <button 
                                onClick={() => { 
                                    setShowMenuForStory(null); 
                                    setStoryToDelete(story._id); 
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        </div>
                    )}
                </div>
            )}

            <p className="absolute top-16 left-3 text-white/80 text-sm truncate max-w-24">
              {story.content}
            </p>

            <p className="text-white absolute bottom-2 right-2 z-10 text-xs font-medium bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-sm">
              {moment(story.createdAt).fromNow()}
            </p>

            {story.media_type !== "text" && (
              <div className="absolute inset-0 z-0 rounded-lg overflow-hidden">
                {story.media_type === "image" ? (
                  <img
                    src={story.media_url}
                    alt=""
                    className="h-full w-full object-cover group-hover:scale-110 transition duration-500 opacity-80"
                  />
                ) : (
                  <video
                    src={story.media_url}
                    className="h-full w-full object-cover group-hover:scale-110 transition duration-500 opacity-80"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <StoryModal setShowModal={setShowModal} fetchStories={fetchStories} />
      )}
      {viewStory && (
        <StoryViewer viewStory={viewStory} setViewStory={setViewStory} />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
          {storyToDelete && (
              <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
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
                            onClick={() => setStoryToDelete(null)}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
                         >
                            Cancel
                         </button>
                         <button 
                            onClick={handleDelete}
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
};

export default StoriesBar;
