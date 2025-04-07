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
}

export function TeamMembersCard({ teamId }: TeamMembersCardProps) {
  const [limit, setLimit] = useState(5);

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: [teamId ? `/api/teams/${teamId}/members` : "/api/users"],
    enabled: teamId !== undefined || true,
  });

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300";
      case "design":
        return "bg-blue-100 dark:bg-blue-900 text-primary";
      case "frontend":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
      case "backend":
        return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
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
        <Button variant="ghost" size="icon">
          <PlusCircle className="h-5 w-5 text-primary" />
        </Button>
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
            {teamMembers?.slice(0, limit).map((member) => {
              // If we're directly getting users, use the user object
              // If we're getting team members, use the nested user object
              const user = member.user || member;
              const role = member.role || user.role;

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
                        {user.role || "Member"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={getRoleColor(role)}
                  >
                    {role}
                  </Badge>
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
