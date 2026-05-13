import { Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Loading from "../components/Loading";
import Sidebar from "../components/Sidebar";
import { useSelector } from "react-redux";
import { useUser } from "@clerk/clerk-react";

const Layout = () => {
  const reduxUser = useSelector((state) => state.user.value);
  const { isLoaded, isSignedIn } = useUser();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const hideSidebar = location.pathname === "/login";

  // انتظر Clerk يجهز
  if (!isLoaded) return <Loading />;

  // إذا مو مسجل دخول اصلاً
  if (!isSignedIn) return <Loading />;

  // لا تخلّي Redux يعلقك للأبد
  // إذا تحب تظل تعرض Loading لثواني فقط، خلّها:
  // if (!reduxUser) return <Loading />;
  // لكن الأفضل: كمل عرض الصفحة حتى لو reduxUser لسا ما وصل
  // (لأن الصفحات ممكن تشتغل على Clerk user)

  return (
    <div className="w-full flex h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-200 selection:text-indigo-900 dark:selection:bg-indigo-900 dark:selection:text-indigo-100 overflow-hidden relative z-0">
      {/* Decorative Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/20 dark:bg-purple-900/20 blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 dark:bg-indigo-900/20 blur-[120px] pointer-events-none -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-pink-400/10 dark:bg-pink-900/10 blur-[100px] pointer-events-none -z-10"></div>

      {!hideSidebar && (
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      )}

      <div className="flex-1 flex flex-col h-screen relative">
        {!hideSidebar && (
          <>
            {sidebarOpen ? (
              <X
                className="absolute top-2 right-8 p-2 z-100 bg-blue-600 rounded-md shadow w-10 h-10 text-gray-50 sm:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            ) : (
              <Menu
                className=" absolute top-2 right-8 p-2 z-100 bg-blue-600 rounded-md shadow-2xl w-10 h-10 text-gray-50 sm:hidden"
                onClick={() => setSidebarOpen(true)}
              />
            )}
          </>
        )}

        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
