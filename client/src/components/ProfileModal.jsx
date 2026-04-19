import React, { useState } from "react";
import { X, Pencil } from "lucide-react";
import { useDispatch } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { updateUser } from "../features/user/userSlice";

const ProfileModal = ({ setShowEdit }) => {
  const dispatch = useDispatch();
  const { getToken } = useAuth();

  const user = useSelector((state) => state.user.value);
  const [editForm, setEditForm] = useState({
    username: user.username,
    bio: user.bio,
    location: user.location,
    link: user.link || "",
    profile_picture: null,
    cover_photo: null,
    full_name: user.full_name,
  });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const userData = new FormData();
      const {
        full_name,
        username,
        bio,
        location,
        link,
        profile_picture,
        cover_photo,
      } = editForm;

      userData.append("username", username);
      userData.append("location", location);
      userData.append("link", link);
      userData.append("bio", bio);
      userData.append("full_name", full_name);
      profile_picture && userData.append("profile", profile_picture);

      cover_photo && userData.append("cover", cover_photo);
      const token = await getToken();
      dispatch(updateUser({ userData, token }));
      setShowEdit(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 z-40 h-screen overflow-y-scroll">
      <div className="max-w-2xl sm:my-6 mx-auto relative z-50">
        <div className="bg-white dark:bg-gradient-to-br dark:from-indigo-950/95 dark:to-purple-950/95 dark:backdrop-blur-xl rounded-lg shadow-xl border border-transparent dark:border-indigo-500/20 p-6">
          {/* Header */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Edit Profile
          </h1>

          {/* Form */}
          <form
            className="space-y-4"
            onSubmit={(e) =>
              toast.promise(handleSaveProfile(e), { loading: "Saving" })
            }
          >
            {/* Profile Picture */}
            <div className="flex flex-col items-start gap-3">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Profile Picture
              </span>

              <input
                hidden
                type="file"
                id="profile_picture"
                accept="image/*"
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    profile_picture: e.target.files[0],
                  })
                }
              />

              <label
                htmlFor="profile_picture"
                className="relative group/profile mt-2 cursor-pointer"
              >
                <img
                  src={
                    editForm.profile_picture
                      ? URL.createObjectURL(editForm.profile_picture)
                      : user.profile_picture || null
                  }
                  alt="profile"
                  className="w-24 h-24 rounded-full object-cover"
                />

                <div className="absolute inset-0 hidden group-hover/profile:flex justify-center items-center bg-black/20 rounded-full">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
              </label>
            </div>

            {/* Cover Photo */}
            <div className="flex flex-col items-start gap-3 mt-6">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Cover Photo
              </span>

              <input
                hidden
                type="file"
                id="cover_photo"
                accept="image/*"
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    cover_photo: e.target.files[0],
                  })
                }
              />

              <label
                htmlFor="cover_photo"
                className="relative group/cover mt-2 cursor-pointer"
              >
                <img
                  src={
                    editForm.cover_photo
                      ? URL.createObjectURL(editForm.cover_photo)
                      : user.cover_photo || null
                  }
                  alt="cover"
                  className="w-80 h-40 rounded-lg object-cover bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200"
                />

                <div className="absolute inset-0 hidden group-hover/cover:flex justify-center items-center bg-black/20 rounded-lg">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
              </label>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-indigo-400/30 rounded-lg p-2 bg-white dark:bg-slate-900/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                value={editForm.full_name}
                onChange={(e) =>
                  setEditForm({ ...editForm, full_name: e.target.value })
                }
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Username
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-indigo-400/30 rounded-lg p-2 bg-white dark:bg-slate-900/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                value={editForm.username}
                onChange={(e) =>
                  setEditForm({ ...editForm, username: e.target.value })
                }
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Bio
              </label>
              <textarea
                className="w-full border border-gray-300 dark:border-indigo-400/30 rounded-lg p-2 bg-white dark:bg-slate-900/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                maxLength="200"
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Location
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-indigo-400/30 rounded-lg p-2 bg-white dark:bg-slate-900/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm({ ...editForm, location: e.target.value })
                }
              />
            </div>

            {/* Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Website or Social Link
              </label>
              <input
                type="text"
                placeholder="e.g. twitter.com/username"
                className="w-full border border-gray-300 dark:border-indigo-400/30 rounded-lg p-2 bg-white dark:bg-slate-900/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                value={editForm.link}
                onChange={(e) =>
                  setEditForm({ ...editForm, link: e.target.value })
                }
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-6">
              <button
                onClick={() => setShowEdit(false)}
                type="button"
                className="px-4 py-2 border border-gray-300 dark:border-indigo-400/30 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
