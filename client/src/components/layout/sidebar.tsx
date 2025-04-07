import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  MessageSquare,
  FolderArchive,
  Settings,
  HelpCircle,
  ChevronLeft,
  PlusIcon,
  Users,
  Users2,
  UserCog,
  LifeBuoy,
} from "lucide-react";
import { CreateProjectDialog } from "@/components/common/create-project-dialog";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  const { data: teams } = useQuery({
    queryKey: ["/api/teams"],
    enabled: !!user,
  });

  const mainNavItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: ROUTES.DASHBOARD,
    },
    {
      title: "Projects",
      icon: <CheckSquare className="h-5 w-5" />,
      href: ROUTES.PROJECTS,
    },
    {
      title: "Calendar",
      icon: <Calendar className="h-5 w-5" />,
      href: ROUTES.CALENDAR,
    },
    {
      title: "Teams",
      icon: <Users className="h-5 w-5" />,
      href: ROUTES.TEAMS,
    },
    {
      title: "Messages",
      icon: <MessageSquare className="h-5 w-5" />,
      href: ROUTES.CHAT,
    },
    {
      title: "Files",
      icon: <FolderArchive className="h-5 w-5" />,
      href: ROUTES.FILES,
    },
  ];

  const secondaryNavItems = [
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: ROUTES.SETTINGS,
    },
    {
      title: "Help & Support",
      icon: <HelpCircle className="h-5 w-5" />,
      href: "#",
    },
  ];
  
  // Admin section only visible for admin users
  const adminNavItems = user?.role === "admin" ? [
    {
      title: "User Management",
      icon: <UserCog className="h-5 w-5" />,
      href: ROUTES.ADMIN_USERS,
    },
  ] : [];

  return (
    <>
      <aside
        className={cn(
          "transition-all duration-300 h-screen fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-dark-lighter shadow-md border-r border-gray-200 dark:border-dark",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          "w-0 lg:flex"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-dark-lighter">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-primary text-white p-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
            {!isCollapsed && <h1 className="font-inter font-bold text-xl">TeamFlow One</h1>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex"
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform",
                isCollapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-2 mb-4">
            <h3
              className={cn(
                "text-xs uppercase font-semibold text-gray-500 dark:text-gray-400",
                isCollapsed && "lg:hidden"
              )}
            >
              Main
            </h3>
          </div>

          {mainNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  location === item.href
                    ? "bg-primary bg-opacity-10 text-primary"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-darker"
                )}
              >
                <span className="mr-3 flex-shrink-0">{item.icon}</span>
                <span className={cn(isCollapsed && "lg:hidden")}>
                  {item.title}
                </span>
              </a>
            </Link>
          ))}

          <div className="px-2 mt-6 mb-4">
            <h3
              className={cn(
                "text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 flex items-center justify-between",
                isCollapsed && "lg:hidden"
              )}
            >
              <span>Projects</span>
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => setIsCreateProjectOpen(true)}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              )}
            </h3>
          </div>

          {isLoadingProjects ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              {projects?.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                >
                  <a
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                      location === `/projects/${project.id}`
                        ? "bg-primary bg-opacity-10 text-primary"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-darker"
                    )}
                  >
                    <span
                      className="w-2 h-2 mr-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    ></span>
                    <span className={cn(isCollapsed && "lg:hidden")}>
                      {project.name}
                    </span>
                  </a>
                </Link>
              ))}

              <Button
                variant="ghost"
                className={cn(
                  "flex items-center px-3 py-2 mt-2 text-sm w-full justify-start font-medium text-primary hover:bg-gray-100 dark:hover:bg-dark-darker",
                  isCollapsed && "justify-center"
                )}
                onClick={() => setIsCreateProjectOpen(true)}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                <span className={cn(isCollapsed && "lg:hidden")}>
                  Add New Project
                </span>
              </Button>
            </>
          )}

          {/* Admin section for admin users */}
          {adminNavItems.length > 0 && (
            <>
              <div className="px-2 mt-6 mb-4">
                <h3
                  className={cn(
                    "text-xs uppercase font-semibold text-gray-500 dark:text-gray-400",
                    isCollapsed && "lg:hidden"
                  )}
                >
                  Admin
                </h3>
              </div>
              
              {adminNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                      location === item.href
                        ? "bg-primary bg-opacity-10 text-primary"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-darker"
                    )}
                  >
                    <span className="mr-3 flex-shrink-0">{item.icon}</span>
                    <span className={cn(isCollapsed && "lg:hidden")}>
                      {item.title}
                    </span>
                  </a>
                </Link>
              ))}
            </>
          )}

          <div className="px-2 mt-6 mb-4">
            <h3
              className={cn(
                "text-xs uppercase font-semibold text-gray-500 dark:text-gray-400",
                isCollapsed && "lg:hidden"
              )}
            >
              Support
            </h3>
          </div>

          {secondaryNavItems.map((item) => (
            <Link key={item.title} href={item.href}>
              <a
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  location === item.href
                    ? "bg-primary bg-opacity-10 text-primary"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-darker"
                )}
              >
                <span className="mr-3 flex-shrink-0">{item.icon}</span>
                <span className={cn(isCollapsed && "lg:hidden")}>
                  {item.title}
                </span>
              </a>
            </Link>
          ))}
        </nav>
      </aside>

      <CreateProjectDialog
        open={isCreateProjectOpen}
        onOpenChange={setIsCreateProjectOpen}
        teams={teams || []}
      />
    </>
  );
}
