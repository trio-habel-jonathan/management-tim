import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link, useParams } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "@/components/kanban/board";
import { TeamMembersCard } from "@/components/dashboard/team-members-card";
import { ProjectProgressCard } from "@/components/dashboard/project-progress-card";
import { CreateTaskDialog } from "@/components/common/create-task-dialog";
import { TaskListView } from "@/components/projects/task-list-view";
import { FileListView } from "@/components/projects/file-list-view";
import { ProjectAnalytics } from "@/components/projects/project-analytics";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@shared/schema";
import { Plus, Calendar, FileText, Users, Settings, MoreHorizontal } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ProjectsPage() {
  const params = useParams();
  const projectId = params.id ? parseInt(params.id) : undefined;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("board");

  // Fetch project details if projectId is provided
  const { data: project, isLoading, isError } = useQuery<Project>({
    queryKey: [projectId ? `/api/projects/${projectId}` : "/api/projects"],
    enabled: !!projectId,
  });

  // Fetch user's role in the team for permission checking
  const { data: teamMember } = useQuery({
    queryKey: [projectId ? `/api/teams/${project?.teamId}/members/current` : null],
    enabled: !!projectId && !!project?.teamId,
  });

  // Fetch all projects if no projectId is provided
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: !projectId,
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project deleted",
        description: "Project has been deleted successfully.",
      });
      setLocation("/projects");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete project",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    },
  });

  // Handle project deletion
  const handleDeleteProject = (id: number) => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteProjectMutation.mutate(id);
    }
  };

  // If viewing a single project
  if (projectId) {
    if (isLoading) {
      return (
        <MainLayout>
          <div className="flex justify-between mb-6">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
          <Skeleton className="h-[calc(100vh-200px)] w-full rounded-lg" />
        </MainLayout>
      );
    }

    if (isError || !project) {
      return (
        <MainLayout>
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 p-6">
              <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
              <Button onClick={() => setLocation("/projects")}>
                View All Projects
              </Button>
            </CardContent>
          </Card>
        </MainLayout>
      );
    }

    return (
      <MainLayout>
        {/* Project Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center">
              <div 
                className="w-4 h-4 mr-3 rounded-full" 
                style={{ backgroundColor: project.color }}
              />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-inter">
                {project.name}
              </h1>
              {teamMember && teamMember.role !== 'guest' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setLocation(`/projects/${project.id}/edit`)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Project
                    </DropdownMenuItem>
                    {teamMember.role === 'admin' && (
                      <DropdownMenuItem 
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Project
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            {project.description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {project.description}
              </p>
            )}
            <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-4">
              <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="h-4 w-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                Started on {formatDate(project.startDate)}
              </div>
              {project.dueDate && (
                <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                  Due by {formatDate(project.dueDate)}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            {teamMember && teamMember.role !== 'guest' && (
              <Button
                onClick={() => setIsCreateTaskOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            )}
          </div>
        </div>

        {/* Project Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="board" className="mt-0">
            <KanbanBoard projectId={project.id} />
          </TabsContent>
          
          <TabsContent value="list" className="mt-0">
            {/* Import TaskListView component at top of file */}
            <TaskListView projectId={project.id} />
          </TabsContent>
          
          <TabsContent value="files" className="mt-0">
            {/* Import FileListView component at top of file */}
            <FileListView projectId={project.id} />
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-0">
            <div className="space-y-6">
              {/* Import ProjectAnalytics component at top of file */}
              <ProjectAnalytics projectId={project.id} />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <TeamMembersCard 
                  teamId={project.teamId}
                  showRoleBadges={true} 
                  currentUserRole={teamMember?.role}
                />
                <div className="lg:col-span-2">
                  <ProjectProgressCard projectId={project.id} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Task Dialog */}
        <CreateTaskDialog
          open={isCreateTaskOpen}
          onOpenChange={setIsCreateTaskOpen}
          projectId={project.id}
        />
      </MainLayout>
    );
  }

  // If viewing all projects
  return (
    <MainLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-inter">
          Projects
        </h1>
        <Button 
          onClick={() => setLocation("/projects/new")} 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {!projects || projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 p-6">
            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Projects Yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-center">
              Get started by creating your first project to organize tasks and collaborate with your team.
            </p>
            <Button onClick={() => setLocation("/projects/new")}>
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id}
              className="hover:shadow-md transition-shadow duration-200"
            >
              <CardContent className="p-0">
                <div 
                  className="h-2" 
                  style={{ backgroundColor: project.color }}
                />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {project.name}
                    </h2>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setLocation(`/projects/${project.id}/edit`)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                    {project.description || "No description provided."}
                  </p>
                  
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-6">
                    <Calendar className="h-4 w-4 mr-1.5" />
                    {formatDate(project.startDate)}
                  </div>
                  
                  <Link href={`/projects/${project.id}`}>
                    <Button className="w-full">View Project</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
