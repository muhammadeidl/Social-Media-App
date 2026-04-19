import { Calendar, PenBox, Verified, MapPin, MessageCircle, Link as LinkIcon } from "lucide-react";
import moment from "moment";
import { Link } from "react-router-dom";
import { useState } from "react";
import ProfileConnectionsModal from "./ProfileConnectionsModal";


const UserProfileInfo = ({ user, posts = [], profileId, setShowEdit, refreshData, onViewImage }) => {
  const [activeModal, setActiveModal] = useState(null);

  const isMyProfile = !profileId; 

  const handleOpenModal = (type) => {
    setActiveModal(type);
  };

  const getModalData = () => {
    switch (activeModal) {
      case "Followers": return user?.followers || [];
      case "Following": return user?.following || [];
      case "Connections": return user?.connections || [];
      default: return [];
    }
  };

  return (
    <div className="relative py-4 px-6 md:px-8 bg-white dark:bg-transparent">
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Avatar */}
        <div 
          className={`w-32 h-32 border-4 border-white dark:border-slate-800 shadow-lg absolute -top-16 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-800 ${user?.profile_picture ? "cursor-pointer" : ""}`}
          onClick={() => user?.profile_picture && onViewImage && onViewImage(user.profile_picture)}
        >
          {user?.profile_picture && (
            <img
              src={user.profile_picture}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              alt="Profile"
            />
          )}
        </div>

        <div className="w-full pt-20 md:pt-4 md:pl-36">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            {/* Name + username */}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {user?.full_name || "Unnamed user"}
                </h1>

                {user?.is_verified && (
                  <Verified className="w-6 h-6 text-blue-500" />
                )}
              </div>

              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {user?.username ? `@${user.username}` : "Add a username"}
              </p>
            </div>

            {/* Edit button (only if this is my profile) */}
            {!profileId && (
              <button
                onClick={() => setShowEdit?.(true)}
                className="flex items-center gap-2 border border-gray-300 dark:border-slate-700
                           hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg font-medium
                           transition-colors mt-2 md:mt-0 cursor-pointer"
              >
                <PenBox className="w-4 h-4" />
                Edit
              </button>
            )}

            {profileId && (
              <Link
                to={`/messages/${user?._id}`}
                className="flex items-center gap-2 border border-gray-300 dark:border-slate-700
                           hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg font-medium
                           transition-colors mt-2 md:mt-0 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Message
              </Link>
            )}
          </div>

          {/* Bio */}
          <p className="text-gray-700 dark:text-gray-300 text-sm max-w-md mt-4">
            {user?.bio || "Add a short bio about yourself."}
          </p>

          {/* Location + link + joined date */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400 mt-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {user?.location || "Add location"}
            </span>

            {user?.link && (
              <a 
                href={user.link.startsWith('http') ? user.link : `https://${user.link}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1.5 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
              >
                <LinkIcon className="w-4 h-4" />
                {user.link.replace(/^https?:\/\//, '')}
              </a>
            )}

            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Joined {moment(user?.createdAt).format("DD.MM.YYYY")}</span>
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-6 border-t border-gray-200 dark:border-slate-800 pt-4 flex-wrap">
            <div className="text-center hover:bg-gray-50 dark:hover:bg-slate-800 p-2 rounded-lg transition cursor-pointer">
              <span className="sm:text-xl font-bold text-gray-900 dark:text-gray-100 block">
                {posts?.length ?? 0}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Posts
              </span>
            </div>
            
            <button onClick={() => handleOpenModal("Followers")} className="text-center hover:bg-gray-50 dark:hover:bg-slate-800 p-2 rounded-lg transition cursor-pointer">
                <span className="sm:text-xl font-bold text-gray-900 dark:text-gray-100 block">{user?.followers?.length ?? 0}</span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Followers
                </span>
            </button>
            
            <button onClick={() => handleOpenModal("Following")} className="text-center hover:bg-gray-50 dark:hover:bg-slate-800 p-2 rounded-lg transition cursor-pointer">
                <span className="sm:text-xl font-bold text-gray-900 dark:text-gray-100 block">{user?.following?.length ?? 0}</span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Following
                </span>
            </button>



          </div>
        </div>
      </div>

      {activeModal && (
        <ProfileConnectionsModal
          title={activeModal}
          data={getModalData()}
          onClose={() => setActiveModal(null)}
          isMyProfile={isMyProfile}
          refreshData={refreshData}
        />
      )}
    </div>
  );
};

export default UserProfileInfo;
