import { Link, useParams, useLocation } from "react-router-dom";
import Loading from "../components/Loading";
import PostCard from "../components/PostCard";
import UserProfileInfo from "../components/UserProfileInfo";
import { useEffect, useState } from "react";
import moment from "moment";
import ProfileModal from "../components/ProfileModal";
import ImageViewer from "../components/ImageViewer";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const Profile = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const currentUser = useSelector((state) => state.user.value);

  const { profileId } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [showEdit, setShowEdit] = useState(false);
  const [viewImageSrc, setViewImageSrc] = useState(null);
  const location = useLocation();

  const fetchUser = async (profileId) => {
    const token = await getToken();
    try {
      const { data } = await api.post(
        "/api/user/profiles",
        { profileId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

        if (data.success) {
        setUser(data.profile);
        setPosts(data.posts);
        setLikedPosts(data.likedPosts || []);
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      toast.error(error.message);
    }
  }
  

  useEffect(() => {
    if (profileId) {
      fetchUser(profileId);
    } else if (currentUser?._id) {
      fetchUser(currentUser._id);
    }
  }, [profileId, currentUser]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetPostId = params.get("postId");
    if (targetPostId && posts.length > 0 && activeTab === "posts") {
      setTimeout(() => {
        const element = document.getElementById(`post-${targetPostId}`);
        const container = document.getElementById("profile-scroll-container");
        if (element && container) {
          const targetScrollTop = element.offsetTop - (container.clientHeight / 2) + (element.clientHeight / 2);
          container.scrollTo({
              top: targetScrollTop,
              behavior: "smooth"
          });
          element.classList.add("ring-4", "ring-indigo-500", "ring-offset-4", "ring-offset-slate-50", "dark:ring-offset-slate-900");
          setTimeout(() => {
              element.classList.remove("ring-4", "ring-indigo-500", "ring-offset-4", "ring-offset-slate-50", "dark:ring-offset-slate-900");
          }, 2000);
        }
      }, 300);
    }
  }, [location.search, posts, activeTab]);

  return user ? (
    <div id="profile-scroll-container" className="relative h-full overflow-y-scroll p-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="rounded-2xl bg-white dark:bg-slate-900/80 shadow border border-transparent dark:border-slate-800 overflow-hidden">
          <div 
            className="h-40 md:h-56 bg-linear-to-r from-indigo-200 via-purple-200 to-pink-200 cursor-pointer"
            onClick={() => user.cover_photo && setViewImageSrc(user.cover_photo)}
          >
            {user.cover_photo && (
              <img
                src={user.cover_photo}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                alt="cover"
              />
            )}
          </div>
        </div>

        <UserProfileInfo
          user={user}
          posts={posts}
          profileId={profileId}
          setShowEdit={setShowEdit} // 👈 نمررله setShowEdit
          refreshData={() => fetchUser(profileId || currentUser?._id)}
          onViewImage={(src) => setViewImageSrc(src)}
        />

        {/* Tabs */}
        <div className="mt-6">
          <div className="bg-white dark:bg-slate-900/80 rounded-xl shadow border border-transparent dark:border-slate-800 p-1 max-w-md mx-auto flex gap-2">
            {["posts", "media", "likes", ...(currentUser?._id === user._id ? ["saved"] : [])].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer
                ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs Content */}
        <div className="mt-6 flex flex-col items-center">
          {/* POSTS TAB */}
          {activeTab === "posts" && (
              <div className="space-y-4 w-full max-w-2xl">
               {posts.length > 0 ? (
                 posts.map((post) => (
                   <div id={`post-${post._id}`} key={post._id} className="transition-all duration-700 rounded-2xl w-full">
                     <PostCard post={post} />
                   </div>
                 ))
               ) : (
                 <div className="text-center py-10 text-gray-500">
                   No posts yet.
                 </div>
               )}
             </div>
          )}
          
           {/* SAVED TAB */}
           {activeTab === "saved" && (
             <div className="space-y-4">
               {user?.saved_posts?.length > 0 ? (
                 [...user.saved_posts].reverse().map((post) => (
                   post && (
                     <PostCard
                       key={post._id}
                       post={post}
                       onPostUnsaved={(postId) => {
                         setUser((prev) => ({
                           ...prev,
                           saved_posts: prev.saved_posts.filter((p) =>
                             (p._id || p) !== postId
                           ),
                         }));
                       }}
                     />
                   )
                 ))
               ) : (
                 <div className="text-center py-10 text-gray-500">
                   No saved posts yet.
                 </div>
               )}
             </div>
           )}

          {/* MEDIA TAB */}
          {activeTab === "media" && (
            <div className="flex flex-wrap gap-4 justify-center p-6">
              {posts
                .filter((post) => post.image_urls && post.image_urls.length > 0)
                .flatMap((post) =>
                  post.image_urls.map((image, index) => (
                    <Link
                      target="_blank"
                      to={image}
                      key={`${post._id}-${index}`}
                      className="relative group"
                    >
                      <img
                        src={image}
                        className="w-64 aspect-video object-cover rounded-lg shadow"
                        alt="post media"
                      />

                      <p
                        className="absolute bottom-0 right-0 text-xs text-white p-1 px-3
                        bg-black/40 backdrop-blur-md rounded-tl-lg
                        opacity-0 group-hover:opacity-100 transition duration-300"
                      >
                        Posted {moment(post.createdAt).fromNow()}
                      </p>
                    </Link>
                  ))
                )}
            </div>
          )}

          {/* LIKES TAB */}
          {activeTab === "likes" && (
             <div className="space-y-4">
               {likedPosts.length > 0 ? (
                 [...likedPosts].reverse().map((post) => (
                   <PostCard
                     key={post._id}
                     post={post}
                     onPostDeleted={(postId) =>
                       setLikedPosts((prev) => prev.filter((p) => p._id !== postId))
                     }
                     onPostUnliked={(postId) =>
                       setLikedPosts((prev) => prev.filter((p) => p._id !== postId))
                     }
                   />
                 ))
               ) : (
                 <div className="text-center py-10 text-gray-500">
                   No liked posts yet.
                 </div>
               )}
             </div>
          )}
        </div>

        {showEdit && (
          <ProfileModal user={user} setShowEdit={() => setShowEdit(false)} />
        )}
        {viewImageSrc && (
          <ImageViewer src={viewImageSrc} onClose={() => setViewImageSrc(null)} />
        )}
      </div>
    </div>
  ) : (
    <Loading height="70vh" />
  );
};

export default Profile;
