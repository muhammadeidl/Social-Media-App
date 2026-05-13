import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Sparkles, Circle, Send, Loader2 } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { fetchConnections } from "../features/connections/connectionsSlice";

const RightSidebar = () => {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const connectionsState = useSelector((state) => state.connections);
  const following = connectionsState?.following || [];
  const followingIds = following.map((user) => user._id);
  const user = useSelector((state) => state.user.value);

  // AI Chatbot State
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setAiResponse(""); // clear previous response
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/ai/chat",
        { message: aiInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setAiResponse(data.reply);
        setAiInput("");
      } else {
        toast.error(data.message || "Failed to get AI response");
      }
    } catch (error) {
      toast.error(error?.message || "Something went wrong asking AI");
    } finally {
      setIsAiLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      if (!isLoaded || !isSignedIn) return;
      setLoading(true);
      const token = await getToken();
      
      const { data } = await api.get("/api/user/search", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success && data.users) {
        let suggestions = data.users.filter(
          (u) => u._id !== user?._id && !followingIds.includes(u._id)
        );
        
        suggestions = suggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
        setSuggestedUsers(suggestions);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const token = await getToken();
      const isFollowing = following.includes(userId);
      const endpoint = isFollowing ? "/api/user/unfollow" : "/api/user/follow";

      const { data } = await api.post(
        endpoint,
        { id: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Followed successfully!");
        setSuggestedUsers((prev) => prev.filter((u) => u._id !== userId));
        dispatch(fetchConnections(token));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.message || "Follow failed");
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      fetchSuggestedUsers();
      if (following.length === 0) {
        getToken().then(token => {
          if (token) dispatch(fetchConnections(token));
        });
      }
    }
  }, [isLoaded, isSignedIn, user]);

  return (
    <div className="hidden lg:block w-80 shrink-0 sticky top-24 space-y-6">
      <div className="bg-gradient-to-br from-indigo-50/80 dark:from-indigo-900/20 to-purple-50/80 dark:to-purple-900/20 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 dark:border-slate-800 p-5 relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200 dark:bg-purple-900 rounded-full blur-3xl opacity-30 -mr-10 -mt-10"></div>
        <h2 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 mb-3 relative z-10">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          AI Chat Assistant
        </h2>
        
        <div className="space-y-3 relative z-10">
          <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mb-2">Ask me for post ideas or anything else!</p>
          
          <form onSubmit={handleAskAI} className="relative">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Message AI..."
              className="w-full bg-white dark:bg-slate-800 border border-purple-100 dark:border-slate-700 rounded-lg py-2.5 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-500 text-gray-800 dark:text-gray-100 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <button
              type="submit"
              disabled={!aiInput.trim() || isAiLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:text-gray-300 dark:disabled:text-gray-600 transition-colors"
            >
              {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>

          {aiResponse && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 shadow-sm border border-purple-50 dark:border-slate-700 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
              {aiResponse}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 dark:border-slate-800 p-5 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="flex items-center mb-4">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-500" />
            Suggested for you
          </h2>
        </div>

        <div className="space-y-4">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-2 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))
          ) : suggestedUsers.length > 0 ? (
            suggestedUsers.map((su) => (
              <div key={su._id} className="flex items-center justify-between gap-2 group">
                <div 
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  onClick={() => navigate(`/profile/${su._id}`)}
                >
                  <img
                    src={su.profile_picture}
                    alt={su.full_name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-100 dark:border-slate-800"
                  />
                  <div className="truncate">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {su.full_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{su.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleFollow(su._id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors shrink-0 cursor-pointer group/follow
                  ${following.includes(su._id)
                    ? "text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                    : "text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-500"
                  }`}
                >
                  {following.includes(su._id) ? (
                    <>
                      <span className="group-hover/follow:hidden">Following</span>
                      <span className="hidden group-hover/follow:inline">Unfollow</span>
                    </>
                  ) : "Follow"}
                </button>
              </div>
            ))
          ) : (
            <div 
              onClick={() => navigate('/connections')}
              className="flex flex-col items-center justify-center p-5 text-center cursor-pointer group rounded-xl border-2 border-dashed border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UserPlus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Grow your network</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">Discover more people and build your connections.</p>
              <span className="mt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:text-white group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 bg-white dark:bg-slate-800 px-4 py-1.5 rounded-full shadow-sm transition-colors border border-gray-100 dark:border-slate-700">
                 Find Connections
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 p-5 text-white relative overflow-hidden group cursor-pointer hover:shadow-indigo-500/40 transition-all duration-300 transform hover:-translate-y-1" onClick={() => navigate('/messages')}>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">Continue your conversation</h3>
            <p className="text-xs text-indigo-100 mt-1">Chat with your connections</p>
          </div>
          <div className="flex -space-x-2">
             {following.slice(0, 3).map((f, i) => (
               <div key={i} className="relative">
                 <img src={f.profile_picture} className="w-8 h-8 rounded-full border-2 border-indigo-500" alt="" />
                 <Circle className="w-2.5 h-2.5 fill-green-400 text-white absolute bottom-0 right-0" />
               </div>
             ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
      </div>
      
      <div className="text-xs text-gray-400 px-2 text-center pb-10">
        <p>Postly © {new Date().getFullYear()} • Privacy • Terms</p>
      </div>
    </div>
  );
};

export default RightSidebar;
