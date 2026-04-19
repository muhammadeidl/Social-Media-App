import { Link, useNavigate } from "react-router-dom";
import { assets, dummyUserData } from "../assets/assets";
import { CirclePlus, LogOut, Search } from "lucide-react";
import { UserButton, useClerk } from "@clerk/clerk-react";
import MenuItems from "./MenuItems";
import { useSelector, useDispatch } from "react-redux";
import { Moon, Sun } from "lucide-react";
import { toggleTheme } from "../features/theme/themeSlice";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const theme = useSelector((state) => state.theme?.value);
  const dispatch = useDispatch();
  const { signOut } = useClerk();

  return (
    <div
      className={`w-60 xl:w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-gray-100 dark:border-slate-800 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col justify-between items-center max-sm:absolute top-0 bottom-0 z-20 ${
        sidebarOpen ? "translate-x-0" : "max-sm:-translate-x-full"
      } transition-all duration-300 ease-in-out`}
    >
      <div className="w-full">
        <div className="flex items-center gap-3 ml-7 my-5 cursor-pointer" onClick={() => navigate("/")}>
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Postly
          </span>
        </div>

        {/* Global Search Bar */}
        <div className="px-6 mb-4 mt-2">
            <div 
              onClick={() => { navigate("/discover"); setSidebarOpen?.(false); }}
              className="flex items-center gap-2 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] group"
            >
                <Search className="w-4 h-4 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                <span className="text-sm font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">Search Postly...</span>
            </div>
        </div>

        <hr className="border-gray-100 dark:border-slate-800 mb-6" />

        <MenuItems setSidebarOpen={setSidebarOpen} />
        <Link
          to="/create-post"
          className="flex items-center justify-center gap-2 py-2.5 mt-6 mx-6 rounded-lg bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 transition text-white cursor-pointer"
        >
          <CirclePlus className="w-5 h-5" />
          Create Post
        </Link>
      </div>

      <div className="w-full border-t border-gray-200 dark:border-slate-800 p-4 px-7 flex items-center justify-between">
        <UserButton />
        <div>
          <h1 className="text-sm font-medium dark:text-gray-200">{user?.full_name || "..."}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">@{user?.username || "..."}</p>
        </div>
        <button onClick={() => dispatch(toggleTheme())} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-300 transition-colors cursor-pointer">
          {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>
        <LogOut
          onClick={signOut}
          className="w-4.5 h-4.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition cursor-pointer"
        />
      </div>
    </div>
  );
};

export default Sidebar;
