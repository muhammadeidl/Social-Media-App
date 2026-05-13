import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { markAsRead, deleteAllNotifications } from "../features/notifications/notificationsSlice";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { CheckCircle, MessageCircle, UserPlus, Heart, Repeat, Reply, Trash2 } from "lucide-react";
import Loading from "../components/Loading";

const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const { items, loading } = useSelector((state) => state.notifications);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
        const token = await getToken();
        dispatch(markAsRead({ notificationId: notification._id, token }));
    }

    if (notification.type === "message") {
      navigate(`/messages/${notification.sender._id}`);
    } else if (notification.type === "connection_request" || notification.type === "connection_accepted") {
      navigate(`/profile/${notification.sender._id}`);
    } else {
      // For post-related notifications, since there's no single post page yet,
      // redirect to the sender's profile
      navigate(`/profile/${notification.sender._id}`);
    }
  };

  const markAllRead = async () => {
    const token = await getToken();
    dispatch(markAsRead({ token }));
  };

  const clearAllNotifications = async () => {
    const token = await getToken();
    dispatch(deleteAllNotifications(token));
  };

  if (loading && items.length === 0) return <Loading />;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 mt-8 sm:mt-0">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        <div className="flex gap-4 items-center">
          {items.some(n => !n.read) && (
            <button 
              onClick={markAllRead} 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              Mark all read
            </button>
          )}
          {items.length > 0 && (
            <button 
              onClick={clearAllNotifications} 
              className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-8">
        {items.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
             No notifications yet.
          </div>
        ) : (
          items.map((notification) => (
            <div 
              key={notification._id} 
              onClick={() => handleNotificationClick(notification)}
              className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-colors border ${
                notification.read 
                  ? "bg-white border-gray-100 hover:bg-gray-50" 
                  : "bg-indigo-50/50 border-indigo-100 hover:bg-indigo-50"
              }`}
            >
              <div className="relative isolate shrink-0">
                <img 
                  src={notification.sender.profile_picture} 
                  alt={notification.sender.full_name} 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white ring-2 ring-white ${
                  notification.type === 'message' ? 'bg-blue-500' : 
                  notification.type === 'connection_accepted' ? 'bg-green-500' :
                  (notification.type === 'like' || notification.type === 'like_comment') ? 'bg-red-500' :
                  notification.type === 'comment' ? 'bg-blue-500' :
                  notification.type === 'reply' ? 'bg-indigo-500' :
                  notification.type === 'repost' ? 'bg-green-500' :
                  'bg-purple-500'
                }`}>
                  {notification.type === 'message' ? (
                    <MessageCircle className="w-3.5 h-3.5" />
                  ) : (notification.type === 'like' || notification.type === 'like_comment') ? (
                    <Heart className="w-3.5 h-3.5 fill-white" />
                  ) : notification.type === 'comment' ? (
                    <MessageCircle className="w-3.5 h-3.5" />
                  ) : notification.type === 'reply' ? (
                    <Reply className="w-3.5 h-3.5" />
                  ) : notification.type === 'repost' ? (
                    <Repeat className="w-3.5 h-3.5" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>

              <div className="flex-1 pt-1">
                <p className="text-sm text-gray-800">
                  <span className="font-bold">{notification.sender.full_name}</span>{" "}
                  {notification.type === "message" ? "sent you a new message." : 
                   notification.type === "connection_accepted" ? "connected with you!" :
                   notification.type === "like" ? "liked your post." :
                   notification.type === "like_comment" ? "liked your comment." :
                   notification.type === "comment" ? "commented on your post." :
                   notification.type === "reply" ? "replied to your comment." :
                   notification.type === "repost" ? "reposted your post." :
                   "interacted with you."}
                </p>
                <span className="text-xs text-gray-500 mt-1 block">
                    {new Date(notification.createdAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                    })}
                </span>
              </div>

              {!notification.read && (
                <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full mt-2 shrink-0"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
