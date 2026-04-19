import { useState } from "react";
import { ArrowLeft, Sparkle, Type as TextIcon, Upload } from "lucide-react";
import { useAuth } from "@clerk/clerk-react"; // أو مسار الـ Hook الخاص بك
import toast from "react-hot-toast";
import api from "../api/axios";

const StoryModal = ({ setShowModal, fetchStories }) => {
    const bgColors = ["#4f46e5", "#7c3aed", "#db2777", "#e11d48", "#ca8a04", "#0d9488"];
    
    // States
    const [mode, setMode] = useState("text");
    const [background, setBackground] = useState(bgColors[0]);
    const [media, setMedia] = useState(null);
    const [text, setText] = useState("");
    const [previewUrl, setPreviewUrl] = useState(null);
    
    const { getToken } = useAuth();
    const MAX_VIDEO_DURATION = 60; // 1 minute
    const MAX_VIDEO_SIZE_MB = 50;

    // دالة رفع الصور والفيديو مع التحقق من الشروط
    const handleMediaUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith("video")) {
                if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
                    toast.error(`Video file size cannot exceed ${MAX_VIDEO_SIZE_MB}MB.`);
                    setMedia(null);
                    setPreviewUrl(null);
                    return;
                }

                const video = document.createElement("video");
                video.preload = "metadata";
                video.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(video.src);
                    if (video.duration > MAX_VIDEO_DURATION) {
                        toast.error("Video duration cannot exceed 1 minute.");
                        setMedia(null);
                        setPreviewUrl(null);
                    } else {
                        setMedia(file);
                        setPreviewUrl(URL.createObjectURL(file));
                        setText("");
                        setMode("media");
                    }
                };
                video.src = URL.createObjectURL(file);
            } else if (file.type.startsWith("image")) {
                setMedia(file);
                setPreviewUrl(URL.createObjectURL(file));
                setText("");
                setMode("media");
            }
        }
    };

    // دالة إنشاء الستوري (ترجع Promise ليعمل معها toast.promise)
    const handleCreateStory = async () => {
        const media_type = mode === "media" ? (media?.type.startsWith("image") ? "image" : "video") : "text";

        if (media_type === "text" && !text.trim()) {
            throw new Error("Please enter some text");
        }

        const formData = new FormData();
        formData.append("content", text);
        formData.append("media_type", media_type);
        if (media) formData.append("media", media);
        formData.append("background_color", background);

        const token = await getToken();

        const response = await api.post("/api/story/create", formData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
            setShowModal(false);
            fetchStories();
            return response.data;
        } else {
            throw new Error(response.data.message || "Failed to create story");
        }
    };

    return (
        <div className="fixed inset-0 z-[110] min-h-screen bg-black/80 backdrop-blur text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 rounded-2xl shadow-xl p-4">
                
                {/* Header */}
                <div className="text-center mb-4 flex items-center justify-between">
                    <button className="text-white p-2 cursor-pointer hover:bg-zinc-800 rounded-full transition" onClick={() => setShowModal(false)}>
                        <ArrowLeft />
                    </button>
                    <h2 className="text-lg font-semibold">Create Story</h2>
                    <span className="w-10" />
                </div>

                {/* Preview Card */}
                <div 
                    className="rounded-lg h-96 flex items-center justify-center relative overflow-hidden"
                    style={{ backgroundColor: mode === "text" ? background : "#000" }}
                >
                    {mode === "text" && (
                        <textarea
                            className="bg-transparent text-white w-full h-full p-6 text-xl font-medium text-center flex items-center justify-center resize-none focus:outline-none placeholder:text-white/60"
                            placeholder="What's on your mind?"
                            onChange={(e) => setText(e.target.value)}
                            value={text}
                        />
                    )}

                    {mode === "media" && previewUrl && (
                        media?.type.startsWith("image") ? (
                            <img src={previewUrl} alt="preview" className="object-contain max-h-full w-full" />
                        ) : (
                            <video src={previewUrl} className="object-contain max-h-full w-full" controls />
                        )
                    )}
                </div>

                {/* Color Selector (Only for Text Mode) */}
                <div className="flex gap-2 mt-4 justify-center overflow-x-auto py-2">
                    {bgColors.map((color) => (
                        <button
                            key={color}
                            className={`w-8 h-8 rounded-full ring-offset-2 ring-offset-zinc-900 transition-all ${background === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                                setBackground(color);
                                setMode("text");
                            }}
                        />
                    ))}
                </div>

                {/* Mode Selectors */}
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => { setMode("text"); setMedia(null); setPreviewUrl(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${mode === "text" ? "bg-white text-black" : "bg-zinc-800 hover:bg-zinc-700"}`}
                    >
                        <TextIcon size={18} />
                        <span className="font-medium">Text</span>
                    </button>

                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${mode === "media" ? "bg-white text-black" : "bg-zinc-800 hover:bg-zinc-700"}`}>
                        <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
                        <Upload size={18} />
                        <span className="font-medium">Photo/Video</span>
                    </label>
                </div>

                {/* Submit Button with Sparkle Effect */}
                <button
                    onClick={() => toast.promise(handleCreateStory(), {
                        loading: 'Saving Story...',
                        success: <b>Story created successfully!</b>,
                        error: (err) => <b>{err.message}</b>,
                    })}
                    className="w-full mt-4 flex items-center justify-center gap-2 text-white py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20"
                >
                    <Sparkle size={18} />
                    Create Story
                </button>
            </div>
        </div>
    );
};

export default StoryModal;