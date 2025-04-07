import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TeamMembersCard } from "@/components/dashboard/team-members-card";
import { ProjectProgressCard } from "@/components/dashboard/project-progress-card";
import { KanbanBoard } from "@/components/kanban/board";
import { CreateTaskDialog } from "@/components/common/create-task-dialog";
import { CreateProjectDialog } from "@/components/common/create-project-dialog";
import { Plus, Download, CheckSquare, CheckCircle, AlertTriangle } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { Link } from "wouter";
import { Project, Task } from "@shared/schema";

export default function DashboardPage() {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const stats = [
    {
      title: "Total Tasks",
      value: tasks?.length || 0,
      icon: <CheckSquare className="h-5 w-5 text-primary" />,
      iconBgColor: "bg-blue-100 dark:bg-blue-900",
      change: {
        value: 4.5,
        trend: "up" as const,
      },
    },
    {
      title: "Completed Tasks",
      value: tasks?.filter((task) => task.status === "complete").length || 0,
      icon: <CheckCircle className="h-5 w-5 text-secondary" />,
      iconBgColor: "bg-green-100 dark:bg-green-900",
      change: {
        value: 12.3,
        trend: "up" as const,
      },
    },
    {
      title: "In Progress",
      value: tasks?.filter((task) => ["in progress", "review"].includes(task.status)).length || 0,
      icon: <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>,
      iconBgColor: "bg-yellow-100 dark:bg-yellow-900",
      change: {
        value: 0,
        trend: "neutral" as const,
      },
    },
    {
      title: "Overdue Tasks",
      value: tasks?.filter((task) => 
        task.status !== "complete" && 
        task.dueDate && 
        new Date(task.dueDate) < new Date()
      ).length || 0,
      icon: <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />,
      iconBgColor: "bg-red-100 dark:bg-red-900",
      change: {
        value: 5.2,
        trend: "down" as const,
      },
    },
  ];

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-6 md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-7 font-inter">
            Project Dashboard
          </h1>
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-4">
            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              {projects?.length || 0} Active Projects
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:mt-0 space-x-3">
          <Button
            variant="outline"
            className="inline-flex items-center gap-2"
            onClick={() => setIsCreateTaskOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
          <Button 
            className="inline-flex items-center gap-2"
            onClick={() => setIsCreateProjectOpen(true)}
          >
            <Download className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconBgColor={stat.iconBgColor}
            change={stat.change}
          />
        ))}
      </div>

      {/* Task Board */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-inter">
            Task Board
          </h2>
          <Link href={ROUTES.TASKS}>
            <Button variant="link" className="text-primary">
              View All Tasks
            </Button>
          </Link>
        </div>
        <KanbanBoard />
      </div>

      {/* Team Members and Project Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TeamMembersCard />
        <div className="lg:col-span-2">
          <ProjectProgressCard />
        </div>
      </div>

      {/* Dialogs */}
      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
      />

      <CreateProjectDialog
        open={isCreateProjectOpen}
        onOpenChange={setIsCreateProjectOpen}
        teams={[]}
      />
    </MainLayout>
  );
}
