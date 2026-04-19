import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import moment from "moment";

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentMessages = async () => {
    try {
      if (!user) return;
      
      const { data } = await api.get("/api/user/recent-messages", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        const groupedMessages = data.messages.reduce((acc, message) => {
          if (!message.from_user_id || !message.to_user_id) return acc;

          const isMe = message.from_user_id._id === user.id;
          const partnerId = isMe
            ? message.to_user_id._id
            : message.from_user_id._id;

          if (
            !acc[partnerId] ||
            new Date(message.createdAt) > new Date(acc[partnerId].createdAt)
          ) {
            acc[partnerId] = { ...message, partnerId };
          }
          return acc;
        }, {});

        const sortedMessages = Object.values(groupedMessages).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setMessages(sortedMessages);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecentMessages();
      const interval = setInterval(fetchRecentMessages, 30000); // Polling every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <div className="min-h-screen relative bg-transparent">
      <div className="max-w-4xl mx-auto p-6 ">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100 mb-2">Messages</h1>
          <p className="text-slate-500 dark:text-gray-400">Recent conversations</p>
        </div>

        <div className="flex flex-col gap-3">
          {loading ? (
             <div className="text-center py-10">
               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
               <p className="text-gray-500">Loading messages...</p>
             </div>
          ) : messages.length > 0 ? (
            messages.map((message) => {
              const isMe = message.from_user_id._id === user.id;
              const partner = isMe ? message.to_user_id : message.from_user_id;

              if (!partner) return null;

              return (
                <div
                  key={partner._id}
                  onClick={() => navigate(`/messages/${partner._id}`)}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900/80 shadow rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition border border-transparent dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900"
                >
                  <img
                    src={partner.profile_picture}
                    alt={partner.full_name}
                    className="w-14 h-14 rounded-full object-cover border border-gray-100"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="font-semibold text-slate-800 dark:text-gray-100 truncate">{partner.full_name}</h3>
                        <span className="text-xs text-slate-400 dark:text-gray-500 whitespace-nowrap ml-2">
                          {moment(message.createdAt).fromNow()}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className={`text-sm truncate pr-2 ${!message.seen && !isMe ? 'font-semibold text-slate-800 dark:text-gray-100' : 'text-slate-500 dark:text-gray-400'}`}>
                          {isMe && "You: "}
                          {message.text ? message.text : "Sent an attachment"}
                        </p>
                        
                        {!message.seen && !isMe && (
                            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shrink-0"></div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
             <div className="text-center py-20 bg-white dark:bg-slate-900/80 border border-transparent dark:border-slate-800 rounded-lg shadow">
               <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">No messages yet</p>
               <p className="text-gray-400 dark:text-gray-500 mt-2">Start a conversation!</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
