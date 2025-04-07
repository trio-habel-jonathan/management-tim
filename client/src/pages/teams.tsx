import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, User, Plus, Settings, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CreateTeamDialog } from "@/components/common/create-team-dialog";
import { TeamManagementDialog } from "@/components/common/team-management-dialog";
import { type Team } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function TeamsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isManageTeamOpen, setIsManageTeamOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  // Fetch teams the user belongs to
  const { data: teams, isLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    enabled: !!user,
  });

  // Fetch all team members for each team
  const { data: teamMembers } = useQuery({
    queryKey: ["/api/team-members"],
    enabled: !!teams && teams.length > 0,
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      return apiRequest("DELETE", `/api/teams/${teamId}`);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Team deleted",
        description: "Team has been deleted successfully.",
      });
      setTeamToDelete(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete team",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });

  // Handle opening the team management dialog
  const handleManageTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsManageTeamOpen(true);
  };

  // Handle opening the delete team confirmation
  const handleDeleteTeam = (team: Team) => {
    setTeamToDelete(team);
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <PageHeader
        title="Teams"
        description="Manage your teams and team members"
        actions={
          <Button onClick={() => setIsCreateTeamOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        }
      />

      <Tabs defaultValue="all" className="mt-6">
        <TabsList>
          <TabsTrigger value="all">All Teams</TabsTrigger>
          <TabsTrigger value="owned">Teams I Manage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              // Skeleton loading states
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center mb-4">
                      <Skeleton className="h-8 w-8 rounded-full mr-2" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-between">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                  </CardFooter>
                </Card>
              ))
            ) : teams && teams.length > 0 ? (
              teams.map(team => (
                <Card key={team.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl flex items-center">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      {team.name}
                    </CardTitle>
                    <CardDescription>
                      Created {team.createdAt ? formatDate(team.createdAt) : 'recently'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {team.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {team.description}
                      </p>
                    )}
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-2 text-gray-500" />
                      <div className="text-sm">
                        {teamMembers?.filter(member => member.teamId === team.id).length || 0} members
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageTeam(team)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteTeam(team)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
                <Users className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No teams found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  You haven't created or joined any teams yet.
                </p>
                <Button onClick={() => setIsCreateTeamOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Team
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="owned" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              // Skeleton loading states (same as above)
              Array(2).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center mb-4">
                      <Skeleton className="h-8 w-8 rounded-full mr-2" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-between">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                  </CardFooter>
                </Card>
              ))
            ) : teams && teams.filter(team => team.createdBy === user?.id).length > 0 ? (
              teams
                .filter(team => team.createdBy === user?.id)
                .map(team => (
                  <Card key={team.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl flex items-center">
                        <Users className="h-5 w-5 mr-2 text-primary" />
                        {team.name}
                      </CardTitle>
                      <CardDescription>
                        Created {team.createdAt ? formatDate(team.createdAt) : 'recently'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {team.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          {team.description}
                        </p>
                      )}
                      <div className="flex items-center">
                        <User className="h-5 w-5 mr-2 text-gray-500" />
                        <div className="text-sm">
                          {teamMembers?.filter(member => member.teamId === team.id).length || 0} members
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageTeam(team)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteTeam(team)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
                <Users className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No teams you manage</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  You haven't created any teams that you manage yet.
                </p>
                <Button onClick={() => setIsCreateTeamOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create a Team to Manage
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Team Dialog */}
      <CreateTeamDialog
        open={isCreateTeamOpen}
        onOpenChange={setIsCreateTeamOpen}
      />

      {/* Team Management Dialog */}
      <TeamManagementDialog
        open={isManageTeamOpen}
        onOpenChange={setIsManageTeamOpen}
        team={selectedTeam}
      />

      {/* Delete Team Confirmation */}
      <AlertDialog open={!!teamToDelete} onOpenChange={(open) => !open && setTeamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the team "{teamToDelete?.name}"? This action cannot be undone and will remove all projects and tasks associated with this team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => teamToDelete && deleteTeamMutation.mutate(teamToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}