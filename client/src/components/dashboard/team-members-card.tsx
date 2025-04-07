import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface TeamMembersCardProps {
  teamId?: number;
  showRoleBadges?: boolean;
  currentUserRole?: string;
}

// User and Team Member interfaces
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  role?: string;
}

interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  role?: string;
  user: User;
}

type TeamMemberOrUser = TeamMember | User;

export function TeamMembersCard({ teamId, showRoleBadges = true, currentUserRole }: TeamMembersCardProps) {
  const [limit, setLimit] = useState(5);

  const { data: teamMembers, isLoading } = useQuery<TeamMemberOrUser[]>({
    queryKey: [teamId ? `/api/teams/${teamId}/members` : "/api/users"],
    enabled: teamId !== undefined || true,
  });
  
  // Fetch current user's role in the team if not provided
  const { data: currentMember } = useQuery({
    queryKey: [teamId ? `/api/teams/${teamId}/members/current` : null],
    enabled: teamId !== undefined && !currentUserRole,
  });
  
  // Get the role from props or from the API response
  const userRole = currentUserRole || (currentMember?.role || "");

  const getRoleColor = (role?: string) => {
    if (!role) return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
    
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300";
      case "member":
        return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";
      case "guest":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 dark:border-dark-darker flex items-center justify-between">
        <CardTitle className="text-lg font-semibold font-inter">
          Team Members
        </CardTitle>
        {/* Only show add button for admin users */}
        {userRole === "admin" && (
          <Button variant="ghost" size="icon">
            <PlusCircle className="h-5 w-5 text-primary" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {isLoading ? (
          Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="ml-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))
        ) : (
          <>
            {teamMembers && teamMembers.slice(0, limit).map((member: TeamMemberOrUser) => {
              // If we're directly getting users, use the user object
              // If we're getting team members, use the nested user object
              const isTeamMember = 'user' in member && member.user !== undefined;
              const user = isTeamMember ? (member as TeamMember).user : member as User;
              const role = isTeamMember ? (member as TeamMember).role : (member as User).role;

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Avatar>
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  {/* Only show role badges if enabled */}
                  {showRoleBadges && (
                    <Badge
                      variant="outline"
                      className={getRoleColor(role)}
                    >
                      {role || "Member"}
                    </Badge>
                  )}
                </div>
              );
            })}
          </>
        )}
      </CardContent>

      {teamMembers && teamMembers.length > limit && (
        <CardFooter className="p-4 border-t border-gray-200 dark:border-dark-darker">
          <Button
            variant="link"
            className="w-full text-center"
            onClick={() => setLimit(teamMembers.length)}
          >
            View all team members
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
