import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { User, LogOut, Settings, UserCircle } from "lucide-react";
import { useLocation } from "wouter";
import { getInitials } from "@/lib/utils";

interface UserDropdownProps {
  user: {
    fullName: string;
    email: string;
    avatar?: string;
  };
}

export function UserDropdown({ user }: UserDropdownProps) {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
      });
      setLocation(ROUTES.LOGIN);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was a problem logging you out.",
      });
    }
  };

  const initials = getInitials(user.fullName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.fullName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="p-3 border-b border-gray-200 dark:border-dark-darker">
          <p className="text-sm font-medium">{user.fullName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user.email}
          </p>
        </div>
        
        <DropdownMenuItem onClick={() => setLocation("/profile")}>
          <UserCircle className="mr-2 h-4 w-4" />
          <span>My Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => setLocation(ROUTES.SETTINGS)}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900 focus:text-red-600 dark:focus:text-red-400"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
