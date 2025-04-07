import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/ui/theme-provider";
import { UserDropdown } from "@/components/common/user-dropdown";
import { NotificationDropdown } from "@/components/common/notification-dropdown";
import { ROUTES } from "@/lib/constants";
import { Search, Menu, Sun, Moon } from "lucide-react";

type HeaderProps = {
  toggleSidebar: () => void;
};

export function Header({ toggleSidebar }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [onDashboard] = useRoute(ROUTES.DASHBOARD);
  const [onProjects] = useRoute("/projects/:id");
  const [onTasks] = useRoute(ROUTES.TASKS);

  // Get page title from route
  const getPageTitle = () => {
    if (onDashboard) return "Dashboard";
    if (onProjects) return "Project Details";
    if (onTasks) return "Tasks";
    
    // Extract route name from current location
    const [, location] = useLocation();
    const path = location.split('/')[1];
    return path.charAt(0).toUpperCase() + path.slice(1) || "Dashboard";
  };

  return (
    <header className="z-10 bg-white dark:bg-dark-lighter shadow-sm h-16 flex items-center px-4 md:px-6">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden mr-2"
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          {isSearchOpen ? (
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-dark rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:bg-dark dark:text-gray-200"
                autoFocus
                onBlur={() => setIsSearchOpen(false)}
              />
            </div>
          ) : (
            <div className="hidden md:flex items-center text-sm">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getPageTitle()}
              </h1>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-2"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          <NotificationDropdown />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          
          {user ? (
            <UserDropdown user={user} />
          ) : (
            <Button
              className="text-sm"
              onClick={() => setLocation(ROUTES.LOGIN)}
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
