import { useState } from "react";
import toast from "react-hot-toast";
import { Image as ImageIcon, X } from "lucide-react";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const CreatePost = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = useSelector((state) => state.user.value);
  const { getToken } = useAuth();

  // ⛔ لا ترندر الصفحة إذا المستخدم لسه ما وصل
  if (!user) return null;

  const handleSubmit = async () => {
    if (!images.length && !content) {
      return toast.error("Please add at least one image or text");
    }

    setLoading(true);

    const postType =
      images.length && content
        ? "text_with_image"
        : images.length
        ? "image"
        : "text";

    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("post_type", postType);
      images.forEach((image) => {
        formData.append("images", image);
      });

      const { data } = await api.post("/api/post/add", formData, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (data.success) {
        toast.success("Post Added");
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-gray-100 mb-2">
            Create Post
          </h1>
          <p className="text-slate-600 dark:text-gray-400">Share your thoughts with the world</p>
        </div>

        <div className="max-w-xl p-4 sm:p-8 rounded-xl bg-white dark:bg-slate-900/80 shadow-md border border-transparent dark:border-slate-800 space-y-4">
          {/* User info */}
          <div className="flex items-center gap-3">
            <img
              src={user.profile_picture}
              className="w-12 h-12 rounded-full"
              alt={user.full_name}
            />
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-gray-100">{user.full_name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
            </div>
          </div>

          {/* Post content */}
          <textarea
            className="w-full resize-none max-h-32 mt-4 text-sm outline-none placeholder-gray-400 bg-transparent text-gray-800 dark:text-gray-100"
            placeholder="What's happening?"
            onChange={(e) => setContent(e.target.value)}
            value={content}
          />

          {/* Preview images */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {images.map((image, i) => (
                <div key={i} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    className="h-20 rounded-md object-cover"
                    alt=""
                  />
                  <div
                    onClick={() =>
                      setImages((prev) =>
                        prev.filter((_, index) => index !== i)
                      )
                    }
                    className="absolute inset-0 hidden group-hover:flex justify-center items-center bg-black/40 rounded-md cursor-pointer"
                  >
                    <X className="w-6 h-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800 text-gray-300">
            <label
              htmlFor="images"
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition cursor-pointer"
            >
              <ImageIcon className="w-6 h-6" />
              Add photos
            </label>

            <input
              type="file"
              id="images"
              accept="image/*"
              hidden
              multiple
              onChange={(e) =>
                setImages((prev) => [...prev, ...Array.from(e.target.files)])
              }
            />

            <button
              onClick={handleSubmit}
              disabled={loading || (!content && images.length === 0)}
              className={`text-sm bg-gradient-to-r from-indigo-500 to-purple-600 
              hover:from-indigo-600 hover:to-purple-700 
              active:scale-95 transition text-white font-medium px-8 py-2 rounded-md
              ${
                loading || (!content && images.length === 0)
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              {loading ? "Publishing..." : "Publish Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
