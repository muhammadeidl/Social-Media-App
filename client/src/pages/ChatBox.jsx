import { useRef, useState, useEffect } from "react";
import { ImageIcon, SendHorizontal, Trash2, ArrowLeft, MoreVertical, Image as ImageLucide } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  addMessage,
  fetchMessages,
  resetMessages,
} from "../features/messages/messagesSlice";
import toast from "react-hot-toast";
import api from "../api/axios";
import moment from "moment";
import { Link } from "react-router-dom";

const ChatBox = () => {
  const { messages } = useSelector((state) => state.messages);
  const { userId } = useParams();
  const navigate = useNavigate();

  // ✅ Clerk: userId + getToken
  const { userId: currentUserID, getToken, isLoaded, isSignedIn } = useAuth();

  const dispatch = useDispatch();

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [user, setUser] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const scrollContainerRef = useRef(null);

  const connections = useSelector((state) => state.connections.connections);

  const fetchUserMessages = async () => {
    try {
      if (!isLoaded || !isSignedIn) return;
      const token = await getToken();
      dispatch(fetchMessages({ token, userId }));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendMessage = async () => {
    try {
      if (!text && !image) return;
      if (!isLoaded || !isSignedIn) return;

      const token = await getToken();

      const formData = new FormData();
      formData.append("to_user_id", userId); // ✅ من params
      formData.append("text", text);
      if (image) formData.append("image", image);

      const { data } = await api.post("/api/message/send", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (data.success) {
        setText("");
        setImage(null);
        dispatch(addMessage(data.message));
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteConversation = async () => {
    if(!window.confirm("Are you sure you want to delete this entire conversation? This action cannot be undone.")) return;
    
    try {
        const token = await getToken();
        const { data } = await api.post(
            "/api/message/delete-conversation",
            { otherUserId: userId },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (data.success) {
            toast.success(data.message);
            dispatch(resetMessages());
            navigate("/messages"); 
        } else {
            toast.error(data.message);
        }
    } catch (error) {
         toast.error(error?.message || "Failed to delete conversation");
    }
  };

  useEffect(() => {
    fetchUserMessages();
    return () => {
      dispatch(resetMessages());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    const getUserData = async () => {
      try {
        if (connections?.length > 0) {
          const foundUser = connections.find((c) => c._id === userId);
          if (foundUser) {
            setUser(foundUser);
            return;
          }
        }

        // Check if we already have the user data from previous fetch or fallback
        const token = await getToken();
        const { data } = await api.post(
          "/api/user/profiles",
          { profileId: userId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
          setUser(data.profile);
        }
      } catch (error) {
        console.log(error);
      }
    };

    if (userId && isLoaded && isSignedIn) {
        getUserData();
    }
  }, [connections, userId, isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, image]);

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-transparent min-h-0">
      <div className="flex flex-col w-full h-full max-w-4xl mx-auto relative min-h-0">
      {/* --- Chat Header --- */}
      <div className="flex items-center justify-between px-4 py-3 bg-transparent border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/messages")}
              className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition lg:hidden cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            
            <Link to={`/profile/${user?._id}`} className="flex items-center gap-3 group">
              <div className="relative">
                <img
                  src={user?.profile_picture}
                  alt={user?.full_name}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-gray-100 shadow-sm group-hover:ring-2 ring-indigo-100 transition-all"
                />
                <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${user?.isOnline ? "bg-green-500" : "bg-gray-400"}`}></span>
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user?.full_name}</p>
                {user?.isOnline ? (
                  <p className="text-xs text-green-600 font-medium">Online</p>
                ) : (
                  <p className="text-xs text-gray-500 font-medium">
                    Last seen {user?.lastSeen ? moment(user.lastSeen).fromNow() : "long ago"}
                  </p>
                )}
              </div>
            </Link>
        </div>
        
        <div className="relative">
          <button 
             onClick={() => setShowOptions(!showOptions)}
             className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
          >
             <MoreVertical size={20} />
          </button>
          
          {showOptions && (
            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 z-20 py-1 overflow-hidden">
               <button 
                  onClick={() => { setShowOptions(false); navigate(`/profile/${user?._id}`); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
               >
                  View Profile
               </button>
               <button 
                  onClick={() => { setShowOptions(false); handleDeleteConversation(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-between transition cursor-pointer"
              >
                  Delete Chat <Trash2 size={16} />
               </button>
            </div>
          )}
        </div>
      </div>

      {/* --- Chat Messages Area --- */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0">
        {messages.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
                 <img src={user?.profile_picture} className="w-16 h-16 rounded-full opacity-50 grayscale" alt="" />
              </div>
              <p className="font-medium text-gray-500">Say hi to {user?.full_name?.split(' ')[0]}!</p>
              <p className="text-xs">Start the conversation</p>
           </div>
        ) : (
          (() => {
            const sorted = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            const rendered = [];
            let lastDateLabel = "";

            sorted.forEach((message, index) => {
              const msgDate = moment(message.createdAt);
              let dateLabel = msgDate.format("LL");
              if (msgDate.isSame(moment(), "day")) dateLabel = "Today";
              else if (msgDate.isSame(moment().subtract(1, "days"), "day")) dateLabel = "Yesterday";

              if (dateLabel !== lastDateLabel) {
                rendered.push(
                  <div key={`date-${dateLabel}`} className="flex justify-center my-6">
                    <span className="px-4 py-1 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 text-[11px] font-bold rounded-full shadow-sm">
                      {dateLabel}
                    </span>
                  </div>
                );
                lastDateLabel = dateLabel;
              }

              const fromId = typeof message.from_user_id === "object" ? message.from_user_id?._id : message.from_user_id;
              const isCurrentUser = fromId === currentUserID;
             
              // Check if previous message was from the same user to group them visually
              const previousMsg = index > 0 ? sorted[index - 1] : null;
              const prevFromId = previousMsg ? (typeof previousMsg.from_user_id === "object" ? previousMsg.from_user_id?._id : previousMsg.from_user_id) : null;
              const isConsecutive = prevFromId === fromId;

              rendered.push(
                <div
                  key={message._id || index}
                  className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${
                    isCurrentUser ? "ml-auto items-end" : "mr-auto items-start"
                  } ${isConsecutive ? "mt-1" : "mt-4"}`}
                >
                  <div 
                    className={`relative px-4 py-2.5 text-[15px] shadow-sm
                      ${isCurrentUser 
                        ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl rounded-tr-sm" 
                        : "bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-sm"
                      }
                      ${isConsecutive && isCurrentUser ? "rounded-tr-2xl" : ""}
                      ${isConsecutive && !isCurrentUser ? "rounded-tl-2xl" : ""}
                    `}
                  >
                    {message.message_type === "image" && (
                      <div className="mb-2 -mx-2 -mt-1 overflow-hidden rounded-t-xl rounded-b-sm bg-black/5">
                        <img
                          src={message.media_url}
                          className="w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition"
                          alt="Attachment"
                          onClick={() => window.open(message.media_url, '_blank')}
                        />
                      </div>
                    )}
                    {message.text && (
                        <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <span className={`text-[10px] text-gray-400 mt-1 mx-1 ${isCurrentUser ? "mr-2" : "ml-2"}`}>
                     {moment(message.createdAt).format('LT')}
                  </span>
                </div>
              );
            });
            return rendered;
          })()
        )}
      </div>

      {/* --- Message Input Area --- */}
      <div className="p-3 bg-transparent border-t border-gray-200 dark:border-slate-800 backdrop-blur-md shrink-0">
        
        {/* --- Image Preview Overlay --- */}
        {image && (
          <div className="mb-3 p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-4 relative max-w-4xl mx-auto">
             <div className="relative">
               <img src={URL.createObjectURL(image)} className="w-16 h-16 rounded-lg object-cover border border-gray-200 shadow-sm" alt="Preview" />
               <button 
                  onClick={() => setImage(null)}
                  className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500 transition cursor-pointer shadow"
               >
                 ✕
               </button>
             </div>
             <p className="text-sm text-gray-500 font-medium">Image attached</p>
          </div>
        )}

        <div className="flex items-end gap-2 w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-1 shadow-inner focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 focus-within:border-indigo-300 dark:focus-within:border-indigo-700 transition-all">
          
          <label htmlFor="image-upload" className="cursor-pointer p-3 text-gray-400 hover:text-indigo-500 hover:bg-white rounded-xl transition shrink-0 mb-0.5 ml-0.5">
            <ImageLucide size={22} />
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              hidden
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setImage(e.target.files[0]);
                }
              }}
            />
          </label>

          <textarea
            className="flex-1 max-h-32 min-h-[44px] bg-transparent outline-none text-slate-700 dark:text-gray-100 py-3 px-2 resize-none leading-relaxed placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="Type a message..."
            rows={1}
            onKeyDown={(e) => {
               if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
               }
            }}
            onChange={(e) => {
               setText(e.target.value);
               e.target.style.height = 'auto';
               e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            value={text}
          />

          <button
            onClick={sendMessage}
            disabled={!text.trim() && !image}
            className={`p-3 rounded-xl mb-0.5 mr-0.5 transition-all text-white shrink-0
              ${(!text.trim() && !image) 
                ? "bg-gray-300 cursor-not-allowed" 
                : "bg-indigo-600 hover:bg-indigo-700 shadow-md active:scale-95 cursor-pointer"
              }
            `}
          >
            <SendHorizontal size={20} className={(!text.trim() && !image) ? "" : "ml-0.5"} />
          </button>
        </div>
      </div>
      
      </div>
    </div>
  );
};

export default ChatBox;
