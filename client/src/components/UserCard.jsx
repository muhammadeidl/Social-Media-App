import { MapPin, UserCheck, UserPlus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { fetchUser } from "../features/user/userSlice";
import { useNavigate } from "react-router-dom";

const UserCard = ({ user }) => {
  const currentUser = useSelector((state) => state.user.value);
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if(!user) return null;

  const following = currentUser?.following ?? [];
  const isFollowing = following.includes(user._id);

  const handleFollow = async (e) => {
    e.stopPropagation(); // Prevent card click when clicking follow
    if (!isLoaded || !isSignedIn) return;

    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/user/follow",
        { id: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        dispatch(fetchUser(token));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    }
  };

  return (
    <div 
      className="flex flex-col justify-between border border-gray-100 dark:border-slate-800 rounded-xl w-full max-w-[240px] bg-white dark:bg-slate-900/80 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group cursor-pointer"
      onClick={() => navigate(`/profile/${user._id}`)}
    >
      {/* Background Banner (Optional visual enhancement) */}
      <div className="h-16 bg-gradient-to-r from-indigo-100 dark:from-indigo-900/50 to-purple-100 dark:to-purple-900/50 w-full relative"></div>

      <div className="px-5 pb-5 -mt-8 flex flex-col items-center flex-1">
        <img
          src={user.profile_picture}
          className="rounded-full w-20 h-20 object-cover shadow border-4 border-white dark:border-slate-800 mx-auto z-10 bg-white dark:bg-slate-800"
          alt={user.full_name}
        />
        
        <div className="mt-3 text-center w-full">
          <p className="font-bold text-gray-800 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {user.full_name}
          </p>
          
          {user.username && (
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 truncate">
              @{user.username}
            </p>
          )}

          {user.bio ? (
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-xs line-clamp-2 h-8">
              {user.bio}
            </p>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 mt-2 text-xs italic h-8">
              No bio yet
            </p>
          )}
        </div>

        {user.location && (
          <div className="flex items-center justify-center gap-1 mt-3 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 rounded-md text-xs text-indigo-600 dark:text-indigo-300 w-full truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
            <span className="truncate">{user.location}</span>
          </div>
        )}
      </div>

      <div className="p-4 pt-0 border-t border-gray-50/50 dark:border-slate-800 mt-auto flex flex-col gap-2">
        <button
          onClick={handleFollow}
          className={`w-full py-2 rounded-lg flex justify-center items-center gap-2 font-medium text-sm transition-all cursor-pointer
          ${isFollowing 
            ? "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700" 
            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-95"
          }`}
        >
          {isFollowing ? (
            <>
              <UserCheck className="w-4 h-4" />
              Following
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Follow
            </>
          )}
        </button>
        
        <button
          onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${user._id}`);
          }}
          className="w-full py-2 rounded-lg flex justify-center items-center font-medium text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer"
        >
          View Profile
        </button>
      </div>
    </div>
  );
};

export default UserCard;
