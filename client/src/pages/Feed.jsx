import { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import StoriesBar from "../components/StoriesBar";
import PostCard from "../components/PostCard";
import RecentMessages from "../components/RecentMessages";
import QuickPostComposer from "../components/QuickPostComposer";
import RightSidebar from "../components/RightSidebar";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import ErrorBoundary from "../components/ErrorBoundary";
import Loading from "../components/Loading";

const Feed = () => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  const fetchFeeds = async () => {
    try{
      setLoading(true)
      const {data} = await api.get("/api/post/feed", {
        headers:{Authorization : `Bearer ${await getToken()}`}
      })

      if(data.success){
        setFeeds(data.posts)
      }else{
        toast.error(data.message)
      }
    }catch(error){
      toast.error(error.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchFeeds();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="h-full overflow-y-scroll py-10 xl:pr-5 flex items-start justify-center gap-6 xl:gap-8 px-4 lg:px-8">
      {/* Main Content Area */}
      <div className="w-full max-w-2xl shrink-0">
        <StoriesBar />
        <div className="p-0 sm:p-4 mt-2">
          <QuickPostComposer onSuccess={fetchFeeds} />
          <div className="space-y-6">
            {feeds.map((post) => (
              <ErrorBoundary key={post._id}>
                <PostCard post={post} />
              </ErrorBoundary>
            ))}
          </div>
        </div>
      </div>
      
      {/* Right Sidebar Area */}
      <RightSidebar />
    </div>
  );
};

export default Feed;
