import { Users, ArrowRight, UserCheck, Search, ShieldAlert } from "lucide-react";
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
  const blockedUsers = connectionsState?.blockedUsers ?? [];

  const dataArray = useMemo(
    () => [
      { label: "Followers", value: followers, icon: Users, color: "from-blue-500 to-cyan-500" },
      { label: "Following", value: following, icon: UserCheck, color: "from-indigo-500 to-purple-500" },
      { label: "Blocked", value: blockedUsers, icon: ShieldAlert, color: "from-red-500 to-rose-500" },
    ],
    [followers, following, blockedUsers]
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

  const handleUnblock = async (userId) => {
    try {
      const token = await safeGetToken();
      if (!token) return;

      const { data } = await api.post(
        "/api/user/unblock",
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
      toast.error(error?.message || "Unblock failed");
    }
  };

  // acceptConnections removed

  useEffect(() => {
    (async () => {
      const token = await safeGetToken();
      if (!token) return;
      dispatch(fetchConnections(token));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  return (
    <div className="h-full overflow-y-auto no-scrollbar transition-colors duration-300">
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        {/* Header Section */}
        <div className="mb-10 relative">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl rounded-full"></div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent mb-3">
            Connections
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg">
            Manage your professional network, pending requests, and discover new growth opportunities.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {dataArray.map((item, index) => (
            <div
              key={index}
              className="group relative overflow-hidden flex flex-col items-center justify-center p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 rounded-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${item.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
              <div className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform duration-500`}>
                <item.icon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              </div>
              <div className="mt-4 text-center">
                <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{item.label}</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {item.value?.length ?? 0}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
            {dataArray.map((tab) => (
              <button
                onClick={() => setCurrentTab(tab.label)}
                key={tab.label}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 cursor-pointer 
                ${
                  currentTab === tab.label
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <tab.icon className={`w-4 h-4 ${currentTab === tab.label ? "animate-pulse" : ""}`} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {(currentTabData?.value ?? []).map((user) => (
            <div
              key={user._id}
              className="group relative bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-500/30 dark:hover:border-indigo-400/30 p-5 rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-black"
            >
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={user.profile_picture}
                    className="rounded-2xl w-16 h-16 object-cover shadow-lg group-hover:scale-105 transition-transform duration-500 border-2 border-white dark:border-slate-800"
                    alt={user.full_name}
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {user.full_name}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-500 truncate">@{user.username}</p>
                  {user.bio && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-1 italic">
                      "{user.bio.slice(0, 40)}..."
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => navigate(`/profile/${user._id}`)}
                  className="flex items-center justify-center gap-1 py-2.5 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95 cursor-pointer shadow-lg shadow-slate-900/10 dark:shadow-none"
                >
                  Profile
                  <ArrowRight className="w-3 h-3" />
                </button>

                {currentTab === "Following" && (
                  <button
                    onClick={() => handleUnfollow(user._id)}
                    className="py-2.5 text-xs font-bold rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    Unfollow
                  </button>
                )}

                {currentTab === "Blocked" && (
                  <button
                    onClick={() => handleUnblock(user._id)}
                    className="py-2.5 text-xs font-bold rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer"
                  >
                    Unblock
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {(currentTabData?.value ?? []).length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No {currentTab} found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Start exploring to build your network!</p>
            
            <button
              onClick={() => navigate("/discover")}
              className="mt-6 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all active:scale-95 cursor-pointer shadow-xl shadow-indigo-600/20 flex items-center gap-2 group"
            >
              <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Find People to Follow
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;
