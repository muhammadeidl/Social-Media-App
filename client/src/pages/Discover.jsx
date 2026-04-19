import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";

import UserCard from "../components/UserCard";
import Loading from "../components/Loading";
import { useAuth } from "@clerk/clerk-react";
import { useDispatch } from "react-redux";

import api from "../api/axios";
import toast from "react-hot-toast";
import { fetchUser } from "../features/user/userSlice";

const Discover = () => {
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(false);

const { isLoaded, isSignedIn, getToken } = useAuth();
  const dispatch = useDispatch();

  const handleSearch = async (e) => {
    if (e.key !== "Enter") return;
    if (!isLoaded || !isSignedIn) return;
    if (!input.trim()) {
      toast.error("Please type something to search.");
      return;
    }

    setUsers([]);
    setLoading(true);

    try {
      const token = await getToken();

      const { data } = await api.post(
        "/api/user/discover",
        { input },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setUsers(data.users || []);
      } else {
        toast.error(data.message || "Something went wrong.");
      }

      setInput("");
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        const token = await getToken();
        dispatch(fetchUser(token));
        
        setLoading(true);
        const { data } = await api.post("/api/user/discover", { input: "" }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        
        if (data.success && data.users) {
            setUsers(data.users);
        }
        setLoading(false);
      } catch (error) {
        toast.error(error?.response?.data?.message || error.message);
        setLoading(false);
      }
    };

    if (isLoaded && isSignedIn) {
       run();
    }
  }, [dispatch, getToken, isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-6xl mx-auto p-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100 mb-2">
            Discover People
          </h1>
          <p className="text-slate-600 dark:text-gray-400">
            Connect with amazing people and grow your network
          </p>
        </div>

        <div className="mb-8 shadow-md rounded-md border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/80">
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search people by name, username, bio, or location..."
                className="pl-10 sm:pl-12 py-2 w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 rounded-md max-sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                onChange={(e) => setInput(e.target.value)}
                value={input}
                onKeyUp={handleSearch}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          {users.map((user) => (
            <UserCard user={user} key={user._id} />
          ))}

          {!loading && users.length === 0 && (
            <p className="text-slate-500 text-sm">
              No users found. Try a different keyword.
            </p>
          )}
        </div>

        {loading && <Loading height="60vh" />}
      </div>
    </div>
  );
};

export default Discover;
