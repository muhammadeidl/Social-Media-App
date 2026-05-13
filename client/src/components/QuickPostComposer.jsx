import { useState } from "react";
import toast from "react-hot-toast";
import { Image as ImageIcon, X, Smile, MapPin } from "lucide-react";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const QuickPostComposer = ({ onSuccess }) => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const user = useSelector((state) => state.user.value);
  const { getToken } = useAuth();

  if (!user) return null;

  const handleSubmit = async () => {
    if (!images.length && !content.trim()) {
      return navigate("/create-post");
    }

    setLoading(true);

    const postType =
      images.length && content.trim()
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
        toast.success("Posted!");
        setContent("");
        setImages([]);
        if (onSuccess) onSuccess();
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
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 dark:border-slate-800 mb-6 w-full transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <div className="flex gap-3 items-start">
        <img
          src={user.profile_picture}
          className="w-10 h-10 rounded-full object-cover shrink-0"
          alt={user.full_name}
        />
        <div className="flex-1">
          <textarea
            className="w-full bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-900 transition-colors duration-200 rounded-lg p-3 outline-none resize-none placeholder-gray-500 text-gray-800 dark:text-gray-100"
            rows="2"
            placeholder={`What's on your mind, ${user.full_name?.split(' ')[0]}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800">
              {images.map((image, i) => (
                <div key={i} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    className="h-16 w-16 md:h-20 md:w-20 rounded-md object-cover border border-gray-200"
                    alt="Upload preview"
                  />
                  <div
                    onClick={() =>
                      setImages((prev) => prev.filter((_, index) => index !== i))
                    }
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md cursor-pointer hover:bg-gray-100 border border-gray-200"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
        <div className="flex gap-1 md:gap-4">
          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
            <ImageIcon className="w-5 h-5 text-green-500" />
            <span className="hidden md:inline text-sm font-medium">Photo/Video</span>
            <input
              type="file"
              accept="image/*"
              hidden
              multiple
              onChange={(e) =>
                setImages((prev) => [...prev, ...Array.from(e.target.files)])
              }
            />
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all shadow-sm
            ${
              loading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md cursor-pointer active:scale-95"
            }`}
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
};

export default QuickPostComposer;
