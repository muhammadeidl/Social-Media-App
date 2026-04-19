import { NavLink } from "react-router-dom";
import { menuItemsData } from "../assets/assets";
import { useSelector } from "react-redux";

const MenuItems = ({setSidebarOpen}) => {
  const unreadCount = useSelector((state) => state.notifications?.unreadCount || 0);

  return (
    <div className="px-6 text-gray-600 dark:text-gray-300 space-y-1 font-medium">
      {menuItemsData.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `px-3.5 py-2 flex items-center justify-between rounded-xl transition-colors ${
              isActive ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400" : "hover:bg-gray-50 dark:hover:bg-slate-800/50"
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5" />
            {label}
          </div>
          {to === '/notifications' && unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
              {unreadCount}
            </span>
          )}
        </NavLink>
      ))}
    </div>
  );
};

export default MenuItems;
