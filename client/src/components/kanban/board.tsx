import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { KanbanColumn } from "@/components/kanban/column";
import { TASK_STATUSES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Task } from "@shared/schema";

interface KanbanBoardProps {
  projectId?: number;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tasks for the project or all tasks if no projectId
  const { data: tasks, isLoading } = useQuery({
    queryKey: [projectId ? `/api/tasks?projectId=${projectId}` : "/api/tasks"],
    enabled: true,
  });

  // Group tasks by status
  const groupedTasks = tasks?.reduce(
    (acc: Record<string, Task[]>, task: Task) => {
      const status = task.status || "todo";
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(task);
      return acc;
    },
    {}
  ) || {};

  // Ensure all statuses have an array even if empty
  const tasksByStatus = TASK_STATUSES.reduce((acc: Record<string, Task[]>, statusObj) => {
    acc[statusObj.value] = groupedTasks[statusObj.value] || [];
    return acc;
  }, {});

  // Mutation for updating task status
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status, order }: { taskId: number; status: string; order: number }) => {
      return apiRequest("PUT", `/api/tasks/${taskId}/status`, { status, order });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: [`/api/tasks?projectId=${projectId}`] });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update task",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    },
  });

  const handleTaskMove = (taskId: number, newStatus: string, newOrder: number) => {
    updateTaskMutation.mutate({ taskId, status: newStatus, order: newOrder });
  };

  if (isLoading) {
    return (
      <div className="flex space-x-4 overflow-x-auto pb-4 custom-scrollbar">
        {TASK_STATUSES.map((status) => (
          <div
            key={status.value}
            className="kanban-column flex-shrink-0 w-80 bg-gray-100 dark:bg-dark-lighter rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {status.label}
              </h3>
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex space-x-4 overflow-x-auto pb-4 custom-scrollbar">
        {TASK_STATUSES.map((status) => (
          <KanbanColumn
            key={status.value}
            status={status.value}
            title={status.label}
            tasks={tasksByStatus[status.value]}
            projectId={projectId}
            onTaskMove={handleTaskMove}
          />
        ))}
      </div>
    </DndProvider>
  );
}
