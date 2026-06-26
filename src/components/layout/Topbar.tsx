import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  ChevronRight,
  User,
  Settings,
  LogOut,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/DropdownMenu";

interface TopbarProps {
  onMenuClick: () => void;
  onNotificationsClick: () => void;
  onCommandPaletteOpen: () => void;
  notificationCount?: number;
}

function Topbar({ onMenuClick, onNotificationsClick, onCommandPaletteOpen, notificationCount = 0 }: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useUIStore();
  const { user, logout } = useAuthStore();

  const breadcrumbs = location.pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => ({
      label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
      path: `/${segment}`,
    }));

  const userInitials = user
    ? [user.first_name, user.last_name].filter(Boolean).map((n) => n![0]).join("").toUpperCase() || user.username[0].toUpperCase()
    : "U";
  const userName = user ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username : "User";
  const userRole = user?.role?.name || "Admin";

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden items-center gap-1 text-sm text-slate-500 lg:flex">
          <Link to="/" className="hover:text-slate-700 dark:hover:text-slate-300">
            Home
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={crumb.path}>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link
                to={crumb.path}
                className={cn(
                  "hover:text-slate-700 dark:hover:text-slate-300",
                  i === breadcrumbs.length - 1 && "font-medium text-slate-900 dark:text-slate-100"
                )}
              >
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Center - Search */}
      <div className="mx-auto hidden max-w-md flex-1 md:block">
        <button
          onClick={onCommandPaletteOpen}
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search anything...</span>
          <kbd className="hidden rounded border border-slate-300 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-600 lg:inline">
            <Command className="inline h-2.5 w-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onCommandPaletteOpen} className="h-11 w-11 md:hidden">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-11 w-11">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onNotificationsClick} className="relative h-11 w-11">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </Button>
        <DropdownMenu
          trigger={
            <button className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
              <Avatar
                src={user?.avatar ?? undefined}
                initials={userInitials}
                size="sm"
              />
              <div className="hidden text-left text-sm md:block">
                <div className="font-medium text-slate-900 dark:text-slate-100">{userName}</div>
                <div className="text-xs text-slate-500">{userRole}</div>
              </div>
            </button>
          }
        >
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem icon={<User className="h-4 w-4" />} onClick={() => navigate("/settings?tab=profile")}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem icon={<Settings className="h-4 w-4" />} onClick={() => navigate("/settings")}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem icon={<LogOut className="h-4 w-4" />} onClick={logout} danger>
            Logout
          </DropdownMenuItem>
        </DropdownMenu>
      </div>
    </header>
  );
}

export { Topbar };
