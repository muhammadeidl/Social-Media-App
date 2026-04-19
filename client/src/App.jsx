import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Messages from "./pages/Messages";
import ChatBox from "./pages/ChatBox";
import Connections from "./pages/Connections";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import Layout from "./pages/Layout";
import Notifications from "./pages/Notifications";
import Loading from "./components/Loading";

import { useUser, useAuth } from "@clerk/clerk-react";
import toast, { Toaster } from "react-hot-toast";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser } from "./features/user/userSlice.js";
import { fetchConnections } from "./features/connections/connectionsSlice.js";
import { addMessage } from "./features/messages/messagesSlice.js";
import { fetchNotifications, addNotification } from "./features/notifications/notificationsSlice.js";

const App = () => {
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const { pathname } = useLocation();
  const pathnameRef = useRef(pathname);
  const theme = useSelector((state) => state.theme?.value);

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const token = await getToken();
        dispatch(fetchUser(token));
        dispatch(fetchConnections(token));
        dispatch(fetchNotifications(token));
      }
    };
    fetchData();
  }, [user, getToken, dispatch]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (user) {
      const eventSource = new EventSource(
        import.meta.env.VITE_BASEURL + "/api/message/" + user.id
      );

      eventSource.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (pathnameRef.current === "/messages/" + message.from_user_id) {
          dispatch(addMessage(message));
        }
      };

      eventSource.addEventListener("notification", (event) => {
        const notification = JSON.parse(event.data);
        dispatch(addNotification(notification));
        
        if (notification.type === "message" && !pathnameRef.current.includes("/messages")) {
            toast.success(`New message from ${notification.sender.full_name}`);
        } else if (notification.type === "connection_accepted") {
            toast.success(`${notification.sender.full_name} is now connected with you!`);
        } else if (notification.type === "like") {
            toast.success(`${notification.sender.full_name} liked your post`);
        } else if (notification.type === "comment") {
            toast.success(`${notification.sender.full_name} commented on your post`);
        }
      });

      return () => {
        eventSource.close();
      };
    }
  }, [user, dispatch]);

  if (!isLoaded) return <Loading />;

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/sign-in" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/sign-up" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={!user ? <Login /> : <Layout />}>
          <Route index element={<Feed />} />
          <Route path="messages" element={<Messages />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="messages/:userId" element={<ChatBox />} />
          <Route path="connections" element={<Connections />} />
          <Route path="discover" element={<Discover />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:profileId" element={<Profile />} />
          <Route path="create-post" element={<CreatePost />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

export default App;
