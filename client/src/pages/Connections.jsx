import { Users, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import toast from "react-hot-toast";
import { fetchConnections } from "../features/connections/connectionsSlice";

const Connections = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [currentTab, setCurrentTab] = useState("Followers");

  const { isLoaded, isSignedIn, getToken } = useAuth();

  const connectionsState = useSelector((state) => state.connections);

  const connections = connectionsState?.connections ?? [];
  const pendingConnections = connectionsState?.pendingConnections ?? [];
  const followers = connectionsState?.followers ?? [];
  const following = connectionsState?.following ?? [];

  const dataArray = useMemo(
    () => [
      { label: "Followers", value: followers, icon: Users },
      { label: "Following", value: following, icon: Users },
      { label: "Pending", value: pendingConnections, icon: Users },
      { label: "Connections", value: connections, icon: Users },
    ],
    [followers, following, pendingConnections, connections]
  );

  const currentTabData = useMemo(() => {
    return dataArray.find((x) => x.label === currentTab) || dataArray[0];
  }, [dataArray, currentTab]);

  const safeGetToken = async () => {
    if (!isLoaded || !isSignedIn) return null;
    const token = await getToken();
    return token || null;
  };

  const handleUnfollow = async (userId) => {
    try {
      const token = await safeGetToken();
      if (!token) return;

      const { data } = await api.post(
        "/api/user/unfollow",
        { id: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        dispatch(fetchConnections(token));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.message || "Unfollow failed");
    }
  };

  const acceptConnections = async (userId) => {
    try {
      const token = await safeGetToken();
      if (!token) return;

      const { data } = await api.post(
        "/api/user/accept",
        { id: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        dispatch(fetchConnections(token));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.message || "Accept failed");
    }
  };

  useEffect(() => {
    (async () => {
      const token = await safeGetToken();
      if (!token) return;
      dispatch(fetchConnections(token));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Connections
          </h1>
          <p className="text-slate-600">
            Manage your network and discover new connections
          </p>
        </div>

        <div className="flex justify-center w-full mt-4">
          <div className="mb-8 flex flex-wrap gap-6">
            {dataArray.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center gap-1 border h-20 w-40 border-gray-200 bg-white shadow rounded-md"
              >
                <item.icon className="w-5 h-5 text-slate-900" />
                <span className="text-xs text-slate-500">{item.label}</span>
                <b className="text-lg">{item.value?.length ?? 0}</b>
                <p className="text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center w-full mt-4">
          <div className="inline-flex flex-wrap items-center border border-white rounded-md bg-gray-100 shadow-sm gap-8">
            {dataArray.map((tab) => (
              <button
                onClick={() => setCurrentTab(tab.label)}
                key={tab.label}
                className={`flex items-center px-3 py-1 text-sm rounded-md transition-colors cursor-pointer 
                ${
                  currentTab === tab.label
                    ? "bg-white font-medium text-black"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="ml-1">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mt-6">
          {(currentTabData?.value ?? []).map((user) => (
            <div
              key={user._id}
              className="w-full max-w-88 flex gap-5 p-6 bg-white shadow rounded-lg"
            >
              <img
                src={user.profile_picture}
                className="rounded-full w-12 h-12 shadow-md mx-auto"
                alt={user.full_name}
              />
              <div className="flex-1">
                <p className="font-medium text-slate-700">{user.full_name}</p>
                <p className="text-slate-600">@{user.username}</p>
                {user.bio && (
                  <p className="text-sm text-gray-600">
                    {user.bio.slice(0, 30)}...
                  </p>
                )}

                <div className="flex max-sm:flex-col gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/profile/${user._id}`)}
                    className="w-full p-2 text-sm rounded bg-linear-to-r 
                    from-indigo-500 to-purple-600 
                    hover:from-indigo-600 hover:to-purple-700
                    active:scale-95 transition text-white cursor-pointer"
                  >
                    View Profile
                  </button>

                  {currentTab === "Following" && (
                    <button
                      onClick={() => handleUnfollow(user._id)}
                      className="w-full p-2 text-sm rounded bg-slate-100 
                      hover:bg-slate-200 text-black active:scale-95 transition cursor-pointer"
                    >
                      Unfollow
                    </button>
                  )}

                  {currentTab === "Pending" && (
                    <button
                      onClick={() => acceptConnections(user._id)}
                      className="w-full p-2 text-sm rounded bg-slate-100 
                      hover:bg-slate-200 text-black active:scale-95 transition cursor-pointer"
                    >
                      Accept
                    </button>
                  )}

                  {currentTab === "Connections" && (
                    <button
                      onClick={() => navigate(`/messages/${user._id}`)}
                      className="w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Messages
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Connections;
