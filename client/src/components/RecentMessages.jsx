import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import moment from "moment";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const RecentMessages = () => {
  const [messages, setMessages] = useState([]);
  const { user } = useUser();
  const { getToken } = useAuth();
  const fetchRecentMessages = async () => {
    try {
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
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecentMessages();
      const interval = setInterval(fetchRecentMessages, 30000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [user]);

  return (
    <div className="bg-white max-w-xs p-4 min-h-20 rounded-md shadow text-xs text-slate-500">
      <h3 className="font-semibold text-slate-500 mb-4">Recent Messages</h3>
      <div className="flex flex-col  max-h-56 overflow-y-scroll no-scrollbar">
        {messages.map((message, index) => {
          const isMe = message.from_user_id._id === user.id;
          const partner = isMe ? message.to_user_id : message.from_user_id;

          if (!partner) return null;

          return (
            <Link
              to={`/messages/${partner._id}`}
              key={index}
              className="flex items-start gap-3 py-2 hover:bg-slate-100"
            >
              <img
                src={partner.profile_picture}
                className="w-8 h-8 rounded-full"
              />
              <div className="w-full">
                <div className="flex justify-between">
                  <p className="font-medium">{partner.full_name}</p>
                  <p className="text-[10px]">
                    {moment(message.createdAt).fromNow()}
                  </p>
                </div>

                <div className="flex justify-between">
                  <p className="text-gray-500 truncate max-w-[150px]">
                    {isMe && "You: "}
                    {message.text ? message.text : "Media"}
                  </p>
                  {!message.seen && !isMe && (
                    <p className="bg-indigo-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]">
                      1
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RecentMessages;
