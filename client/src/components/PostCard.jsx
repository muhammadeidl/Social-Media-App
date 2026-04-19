import React, { useState, useEffect, useRef } from "react";
import { BadgeCheck, Heart, MessageCircle, Share2, MoreVertical, Trash2, Bookmark, Send, Sparkles, Loader2, Edit, Repeat } from "lucide-react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toggleSavedPost } from "../features/user/userSlice";
import api from "../api/axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import CommentsModal from "./CommentsModal";
import ImageViewer from "./ImageViewer";
import { motion, AnimatePresence } from "framer-motion";

const reactions = ["👍", "❤️", "😂", "😲", "😢", "😡"];

const PostCard = ({ post, onPostDeleted, onPostUnliked, onPostUnsaved }) => {
  const navigate = useNavigate();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const currentUser = useSelector((state) => state.user.value);
  const dispatch = useDispatch();

  const postWithHashtags = (post?.content || "").replace(
    /(#[\w]+)/g,
    '<span class="text-indigo-600">$1</span>'
  );

  const [likes, setLikes] = useState(
    Array.isArray(post?.likes_count) ? post.likes_count : []
  );

  // reactions: { userId: emoji }
  const [reactionsMap, setReactionsMap] = useState(
    post?.reactions ? (post.reactions instanceof Map ? Object.fromEntries(post.reactions) : post.reactions) : {}
  );

  // تحديد التفاعل الحالي للمستخدم عند تحميل المنشور
  const userExistingReaction = currentUser?._id ? reactionsMap[currentUser._id] : null;

  // تحديد حالة الحفظ من بيانات المستخدم الحالي مباشرة
  const [isSaved, setIsSaved] = useState(
    () => Array.isArray(currentUser?.saved_posts) && currentUser.saved_posts.includes(post?._id)
  );

  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post?.comments_count || 0);

  const [sharesCount, setSharesCount] = useState(post?.shares_count || 0);
  const [showMenu, setShowMenu] = useState(false);

  const [showReactions, setShowReactions] = useState(false);
  const [activeReaction, setActiveReaction] = useState(
    userExistingReaction || "👍"
  );
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [aiSummary, setAiSummary] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post?.content || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewImageSrc, setViewImageSrc] = useState(null);

  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteContent, setQuoteContent] = useState("");
  const [repostsCount, setRepostsCount] = useState(Array.isArray(post?.reposts_count) ? post.reposts_count.length : 0);
  const [isReposted, setIsReposted] = useState(Array.isArray(post?.reposts_count) && post.reposts_count.includes(currentUser?._id));
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const menuRef = useRef(null);

  // حماية: إذا لم يكن المنشور موجوداً لا تعرض شيئاً (بعد كل الـ hooks)
  if (!post) return null;

  useEffect(() => {
    if (currentUser?.saved_posts) {
      setIsSaved(currentUser.saved_posts.includes(post._id));
    }
  }, [currentUser?.saved_posts, post._id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLike = async (emoji = "👍") => {
    setActiveReaction(emoji);
    setShowReactions(false);

    try {
      const { data } = await api.post(
        "/api/post/like",
        { postId: post._id, reaction: emoji },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        const updatedLikes = data.likes_count || [];
        setLikes(updatedLikes);
        if (data.reactions) setReactionsMap(data.reactions);

        // إذا أزال المستخدم تفاعله → أخبر الصفحة الأم لإخفاء المنشور فوراً
        if (isLiked && !updatedLikes.includes(currentUser?._id) && onPostUnliked) {
          onPostUnliked(post._id);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to react");
    }
  };

  const submitInlineComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const { data } = await api.post(
        "/api/comment/add",
        { postId: post._id, text: commentText },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        setCommentText("");
        setCommentsCount((c) => c + 1);
        toast.success("Comment added!");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSave = async () => {
      try {
          const { data } = await api.post(
              "/api/post/save",
              { postId: post._id },
              { headers: { Authorization: `Bearer ${await getToken()}` } }
          );

          if(data.success) {
              const newSavedState = !isSaved;
              setIsSaved(newSavedState);
              toast.success(data.message);
              // تحديث Redux فوراً حتى تظهر الأيقونة صحيحة عند التنقل للبروفايل
              dispatch(toggleSavedPost(post._id));
              // إذا ألغى الحفظ → أخبر الصفحة الأم لإخفاء المنشور فوراً
              if (!newSavedState && onPostUnsaved) {
                onPostUnsaved(post._id);
              }
          } else {
              toast.error(data.message);
          }
      } catch (error) {
          toast.error(error.message);
      }
  }

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/post/${post._id}`;

      // Native Share API if supported
      if (navigator.share) {
          await navigator.share({
              title: 'Postly',
              url: url
          });
      } else {
          // Fallback
          await navigator.clipboard.writeText(url);
          toast.success("Link copied");
      }

      // زيادة العداد في السيرفر
      const { data } = await api.post(
        "/api/post/share",
        { postId: post._id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        setSharesCount(
          typeof data.shares_count === "number"
            ? data.shares_count
            : sharesCount + 1
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
          toast.error(error?.message || "Failed to share");
      }
    }
  };

  const handleRepostToggle = async () => {
      setShowRepostMenu(false);
      try {
          const { data } = await api.post(
              "/api/post/repost",
              { postId: post._id },
              { headers: { Authorization: `Bearer ${await getToken()}` } }
          );

          if (data.success) {
              if (data.message === "Repost removed") {
                 setIsReposted(false);
                 setRepostsCount(p => Math.max(0, p - 1));
                 toast.success("Repost removed");
              } else {
                 setIsReposted(true);
                 setRepostsCount(p => p + 1);
                 toast.success("Reposted!");
              }
          } else {
              toast.error(data.message);
          }
      } catch(error) {
          toast.error(error.message);
      }
  };

  const submitQuote = async () => {
      if(!quoteContent.trim()) return;
      setIsSubmittingQuote(true);
      try {
          const { data } = await api.post(
              "/api/post/repost",
              { postId: post._id, content: quoteContent },
              { headers: { Authorization: `Bearer ${await getToken()}` } }
          );
          if (data.success) {
              setRepostsCount(p => p + 1);
              setIsReposted(true);
              setShowQuoteModal(false);
              setQuoteContent("");
              toast.success("Quote posted!");
              // Ideally refresh feed here, but user will see it upon reload
          } else {
              toast.error(data.message);
          }
      } catch(error) {
          toast.error(error.message);
      } finally {
          setIsSubmittingQuote(false);
      }
  };

  const handleDelete = () => {
      setShowMenu(false);
      setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
        const { data } = await api.post(
            "/api/post/delete",
            { postId: post._id },
            { headers: { Authorization: `Bearer ${await getToken()}` } }
        );

        if (data.success) {
            toast.success("Post deleted successfully");
            setShowDeleteModal(false);
            if (onPostDeleted) {
                onPostDeleted(post._id);
            } else {
                 window.location.reload();
            }
        } else {
            toast.error(data.message);
        }
    } catch (error) {
        toast.error(error.message);
    } finally {
        setIsDeleting(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return toast.error("Content cannot be empty");
    setIsUpdating(true);
    try {
      const { data } = await api.post(
        "/api/post/edit",
        { postId: post._id, content: editContent },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success("Post updated!");
        setIsEditing(false);
        post.content = editContent; // Update locally
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to edit post");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSummarize = async () => {
     if (!isLoaded || !isSignedIn) return;
     if (aiSummary) return; // already summarized

     setIsLoadingSummary(true);
     try {
       const { data } = await api.post(
         "/api/post/summarize",
         { postId: post._id },
         { headers: { Authorization: `Bearer ${await getToken()}` } }
       );
       
       if (data.success) {
           setAiSummary(data.summary);
           toast.success("AI generated a summary!");
       } else {
           toast.error(data.message || "Could not generate summary");
       }
     } catch (error) {
       toast.error(error?.message || "Something went wrong summarizing");
     } finally {
       setIsLoadingSummary(false);
     }
  };

  // التحقق إذا كان المستخدم الحالي قد تفاعل مع المنشور
  const isLiked = Array.isArray(likes) && currentUser?._id && likes.includes(currentUser._id);
  // نوع التفاعل المحفوظ
  const myReaction = currentUser?._id ? (reactionsMap[currentUser._id] || "👍") : "👍";

  // If it's a pure repost, the main content is actually the repost_of post
  const isPureRepost = post.post_type === "repost" && post.repost_of;
  const displayPost = isPureRepost ? post.repost_of : post;
  const isQuote = post.post_type === "quote" && post.repost_of;

  const rawContent = isPureRepost ? displayPost.content : post.content || "";
  const isLongContent = rawContent.length > 300;
  const contentToDisplay = (isLongContent && !isExpanded) ? rawContent.substring(0, 300) + "..." : rawContent;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 dark:border-slate-800 p-5 space-y-4 w-full max-w-2xl relative transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      {isPureRepost && (
         <div 
           className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 cursor-pointer w-fit hover:underline"
           onClick={() => navigate(`/profile/${post.user?._id}`)}
         >
             <Repeat className="w-4 h-4" />
             <span>{post.user?.full_name} Reposted</span>
         </div>
      )}

      {/* ---------- User Info ---------- */}
      <div className="flex justify-between items-start">
        <div
            onClick={() => navigate(`/profile/${displayPost.user?._id}`)}
            className="inline-flex items-center gap-3 cursor-pointer"
        >
            <img
            src={displayPost.user?.profile_picture}
            className="w-10 h-10 rounded-full shadow"
            alt=""
            />

            <div>
            <div className="flex items-center space-x-1">
                <span className="font-semibold text-slate-800 dark:text-gray-100">{displayPost.user?.full_name}</span>
                <BadgeCheck className="w-4 h-4 text-blue-500" />
            </div>

            <div className="text-gray-500 dark:text-gray-400 text-sm">
                @{displayPost.user?.username} • {moment(isPureRepost ? post.createdAt : displayPost.createdAt).fromNow()}
            </div>
            </div>
        </div>
        
        <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition">
                <MoreVertical className="w-5 h-5 cursor-pointer" />
            </button>
            {showMenu && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-100 dark:border-slate-700 z-10 py-1">
                     {currentUser?._id === post.user?._id && (
                        <>
                           <button 
                              onClick={() => { setIsEditing(true); setShowMenu(false); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                           >
                               <Edit className="w-4 h-4" />
                               Edit
                           </button>
                           <button 
                              onClick={handleDelete}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                           >
                               <Trash2 className="w-4 h-4" />
                               Delete
                           </button>
                        </>
                     )}
                     <button 
                        onClick={() => { handleSave(); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                     >
                         <Bookmark className={`w-4 h-4 ${isSaved ? "fill-gray-700" : ""}`} />
                         {isSaved ? "Unsave" : "Save"}
                     </button>
                     <button 
                        onClick={() => { handleShare(); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                     >
                         <Share2 className="w-4 h-4" />
                         Share
                     </button>
                </div>
            )}
        </div>
      </div>

      {/* ---------- Post Content (text) ---------- */}
      {isEditing ? (
        <div className="space-y-2">
            <textarea
               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none text-sm text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-indigo-300 resize-none"
               rows="3"
               value={editContent}
               onChange={(e) => setEditContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer">Cancel</button>
                <button onClick={handleEdit} disabled={isUpdating} className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition cursor-pointer">{isUpdating ? "Saving..." : "Save"}</button>
            </div>
        </div>
      ) : rawContent && (
        <div className="space-y-3">
            <div
              className="text-gray-800 dark:text-gray-100 text-[15px] leading-relaxed whitespace-pre-line break-words"
              dangerouslySetInnerHTML={{ __html: contentToDisplay.replace(
                  /(#[\w]+)/g,
                  '<span class="text-indigo-600">$1</span>'
                ) }}
            />
            {isLongContent && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-indigo-600 dark:text-indigo-400 text-[15px] font-semibold hover:underline cursor-pointer mt-1"
                >
                  {isExpanded ? "See less" : "See more"}
                </button>
            )}
            
            {/* AI Summary Button for long posts */}
            {(isPureRepost ? displayPost.content : post.content)?.length >= 50 && !aiSummary && (
                <button 
                  onClick={handleSummarize}
                  disabled={isLoadingSummary}
                  className="flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors w-fit border border-purple-100"
                >
                    {isLoadingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {isLoadingSummary ? "Summarizing..." : "Summarize with AI ✨"}
                </button>
            )}

            {/* AI Summary Result Box */}
            {aiSummary && (
                <div className="relative overflow-hidden bg-gradient-to-r from-indigo-50 dark:from-indigo-900/20 to-purple-50 dark:to-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl p-4 shadow-sm mt-2">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">AI Summary</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-200 text-sm font-medium leading-relaxed italic border-l-2 border-purple-200 dark:border-purple-700 pl-3">"{aiSummary}"</p>
                </div>
            )}
        </div>
      )}

      {/* ---------- Quoted Post (if this is a quote) ---------- */}
      {isQuote && (
          <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 mt-2 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer" onClick={() => navigate("/profile/" + post.repost_of.user?._id)}>
             <div className="flex items-center gap-2 mb-2">
                 <img src={post.repost_of.user?.profile_picture} className="w-5 h-5 rounded-full" />
                 <span className="font-semibold text-sm text-slate-800 dark:text-gray-100">{post.repost_of.user?.full_name}</span>
                 <span className="text-gray-500 dark:text-gray-400 text-xs">@{post.repost_of.user?.username}</span>
             </div>
             {post.repost_of.content && (
                <div className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-line mb-2 line-clamp-4">
                   {post.repost_of.content}
                </div>
             )}
             {post.repost_of.image_urls?.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {post.repost_of.image_urls.map((img, index) => (
                    <img key={index} src={img} className="w-full h-32 object-cover rounded-lg" />
                  ))}
                </div>
             )}
          </div>
      )}

      {/* ---------- Post Content (images) ---------- */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {Array.isArray(displayPost.image_urls) &&
          displayPost.image_urls.map((img, index) => (
            <img
              src={img}
              key={index}
              alt=""
              onClick={() => setViewImageSrc(img)}
              className={`w-full h-64 object-cover rounded-lg border border-gray-100 dark:border-slate-800 cursor-pointer hover:opacity-95 transition-opacity
              ${(displayPost.image_urls?.length ?? 0) === 1 ? "col-span-2 h-auto max-h-[500px]" : ""}`}
            />
          ))}
      </div>

      {/* ---------- Counters ---------- */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-b border-gray-100 dark:border-slate-800 pb-2">
         <div className="flex items-center gap-1">
             {likes.length > 0 && (
                 <div className="flex items-center">
                   {(likes.length > 1 && activeReaction !== "👍") && (
                     <div className="w-[18px] h-[18px] bg-blue-500 rounded-full flex items-center justify-center text-[10px] border border-white dark:border-slate-900 z-10">👍</div>
                   )}
                   <div className={`w-[18px] h-[18px] ${activeReaction === "❤️" ? "bg-red-500" : activeReaction === "👍" ? "bg-blue-500" : "bg-yellow-400"} rounded-full flex items-center justify-center text-[10px] border border-white dark:border-slate-900 ${likes.length > 1 && activeReaction !== "👍" ? "-ml-1 z-20" : ""}`}>
                       {activeReaction}
                   </div>
                   <span className="ml-1.5">{likes.length}</span>
                 </div>
             )}
         </div>
         <div className="flex gap-3">
             {repostsCount > 0 && <span>{repostsCount} reposts</span>}
             {commentsCount > 0 && <span className="hover:underline cursor-pointer" onClick={() => setShowComments(true)}>{commentsCount} comments</span>}
             {sharesCount > 0 && <span>{sharesCount} shares</span>}
         </div>
      </div>

      {/* ---------- Actions (Like - Comment - Share) ---------- */}
      <div className="flex items-center justify-between text-gray-600 dark:text-gray-300 text-sm py-1 relative">
        {/* Like Button Wrapper */}
        <div 
          className="relative flex-1 flex justify-center"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          {/* Reactions Hover Menu */}
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="absolute -top-12 left-0 md:left-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-full px-3 py-2 flex gap-1 items-center z-30"
              >
                {reactions.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.3, originY: 1 }}
                    className="text-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center transition-transform duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(emoji);
                    }}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => handleLike("👍")}
            className={`flex items-center gap-2 py-2 px-2 md:px-4 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 transition w-full justify-center font-medium cursor-pointer
            ${isLiked ? "text-indigo-600 dark:text-indigo-400" : ""}`}
            style={{ width: "100%" }}
          >
            {isLiked ? (
               <motion.span initial={{scale:0}} animate={{scale:1}} className="text-lg">{activeReaction}</motion.span>
            ) : (
                <Heart className="w-5 h-5 hover:scale-110 transition-transform" />
            )}
            <span className="hidden sm:inline">Like</span>
          </button>
        </div>

        {/* Comment */}
        <button
          type="button"
          onClick={() => setShowComments(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-2 md:px-4 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 transition font-medium cursor-pointer"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Comment</span>
        </button>

        {/* Repost */}
        <div className="relative flex-1 flex justify-center">
            <button
              onClick={() => setShowRepostMenu(!showRepostMenu)}
              className={`flex items-center justify-center gap-2 py-2 px-2 md:px-4 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 transition font-medium cursor-pointer w-full
              ${isReposted ? "text-green-600 dark:text-green-500" : ""}`}
            >
              <Repeat className="w-5 h-5" />
              <span className="hidden sm:inline">Repost</span>
            </button>
            
            <AnimatePresence>
              {showRepostMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-12 left-0 md:left-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-xl w-40 z-30 py-2 overflow-hidden"
                >
                  <button 
                    onClick={handleRepostToggle}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition cursor-pointer"
                  >
                    <Repeat className="w-4 h-4" />
                    {isReposted ? "Undo Repost" : "Repost"}
                  </button>
                  <button 
                    onClick={() => { setShowRepostMenu(false); setShowQuoteModal(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                    Quote
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
        </div>

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-2 md:px-4 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 transition font-medium cursor-pointer"
        >
          <Share2 className="w-5 h-5" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Save */}
        <button 
           onClick={handleSave} 
           className="flex items-center justify-center px-4 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer"
        >
           <Bookmark className={`w-5 h-5 ${isSaved ? "fill-gray-800 text-gray-800 dark:fill-gray-200 dark:text-gray-200" : ""}`} />
        </button>
      </div>

      {/* ---------- Inline Comment Input ---------- */}
      <form onSubmit={submitInlineComment} className="flex gap-2 items-center pt-2 border-t border-gray-100 dark:border-slate-800">
        <img
          src={currentUser?.profile_picture}
          className="w-8 h-8 rounded-full border border-gray-100 object-cover"
          alt=""
        />
        <div className="flex-1 relative">
          <input
            type="text"
            className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 focus:bg-gray-100 dark:focus:bg-slate-700 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600 transition-all border-none rounded-full py-2.5 pl-4 pr-12 text-sm outline-none text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!commentText.trim() || isSubmittingComment}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-white bg-indigo-600 disabled:bg-gray-300 disabled:text-gray-100 p-1.5 rounded-full shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 ml-[1px]" />
          </button>
        </div>
      </form>

      {/* Comments Modal */}
      {showComments && (
        <CommentsModal
          postId={post._id}
          postOwnerId={post.user._id}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentsCount((c) => c + 1)}
          onCommentDeleted={() => setCommentsCount((c) => Math.max(0, c - 1))}
        />
      )}

      {/* Image Viewer Modal */}
      {viewImageSrc && (
        <ImageViewer src={viewImageSrc} onClose={() => setViewImageSrc(null)} />
      )}

      {/* Quote Modal */}
      <AnimatePresence>
          {showQuoteModal && (
              <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              >
                  <motion.div 
                     initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                     className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800"
                  >
                     <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-slate-800">
                         <h3 className="font-semibold text-gray-800 dark:text-gray-100">Quote Post</h3>
                         <button onClick={() => setShowQuoteModal(false)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">✕</button>
                     </div>
                     <div className="p-4 space-y-4">
                         <div className="flex gap-3">
                             <img src={currentUser?.profile_picture} className="w-10 h-10 rounded-full" />
                             <textarea 
                                autoFocus
                                className="w-full bg-transparent outline-none text-gray-800 dark:text-gray-100 resize-none min-h-[80px]"
                                placeholder="Add a comment..."
                                value={quoteContent}
                                onChange={(e) => setQuoteContent(e.target.value)}
                             />
                         </div>
                         <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50">
                             <div className="flex items-center gap-2 mb-2">
                                 <img src={displayPost.user?.profile_picture} className="w-5 h-5 rounded-full" />
                                 <span className="font-semibold text-sm text-slate-800 dark:text-gray-100">{displayPost.user?.full_name}</span>
                             </div>
                             <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{displayPost.content}</p>
                         </div>
                     </div>
                     <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                         <button 
                            onClick={submitQuote}
                            disabled={!quoteContent.trim() || isSubmittingQuote}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-medium transition disabled:bg-indigo-400"
                         >
                            {isSubmittingQuote ? "Posting..." : "Post"}
                         </button>
                     </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
          {showDeleteModal && (
              <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              >
                  <motion.div 
                     initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                     className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 p-6 text-center"
                  >
                     <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8 text-red-600 dark:text-red-500" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Post?</h3>
                     <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                        Are you sure you want to delete this post? This action cannot be undone.
                     </p>
                     
                     <div className="flex gap-3 w-full">
                         <button 
                            onClick={() => setShowDeleteModal(false)}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
                         >
                            Cancel
                         </button>
                         <button 
                            onClick={executeDelete}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition cursor-pointer flex items-center justify-center gap-2"
                         >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                         </button>
                     </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default PostCard;
