import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Search,
  MessageSquare,
  Eye,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials, isOverdue, formatDate } from "@/lib/utils";
import { EditTaskDialog } from "@/components/common/edit-task-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import type { User as SchemaUser } from "@shared/schema";

interface TaskListViewProps {
  projectId: number;
}

export function TaskListView({ projectId }: TaskListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Fetch tasks for the project
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: [`/api/tasks?projectId=${projectId}`],
    enabled: !!projectId,
  });
  
  // Fetch users for assignee information
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Filter tasks based on search term
  const filteredTasks = searchTerm 
    ? tasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : tasks;
  
  // Get user details for assignee
  const getUserInfo = (userId?: number): SchemaUser | undefined => {
    if (!userId || !Array.isArray(users)) return undefined;
    return users.find((user: any) => user.id === userId);
  };
  
  // Handle task selection for detail view
  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };
  
  // Handle task selection for edit
  const handleEditTask = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setSelectedTask(task);
    setIsEditOpen(true);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-9 w-full sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>
      
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-dark rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-medium">No tasks found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {tasks.length ? "Try adjusting your search." : "Create a task to get started."}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const isTaskOverdue = task.dueDate ? isOverdue(task.dueDate) : false;
                  const assignee = getUserInfo(task.assigneeId);
                  
                  return (
                    <TableRow 
                      key={task.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleViewTask(task)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{task.title}</span>
                          {task.description && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                              {task.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            task.status === "todo"
                              ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                              : task.status === "in-progress"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              : task.status === "in-review"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          }
                        >
                          {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            task.priority === "low"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : task.priority === "medium"
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }
                        >
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assignee ? (
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={assignee.avatar} />
                              <AvatarFallback>
                                {getInitials(assignee.fullName || assignee.username)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{assignee.fullName || assignee.username}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.dueDate ? (
                          <div
                            className={`flex items-center ${
                              isTaskOverdue
                                ? "text-red-500 dark:text-red-400"
                                : task.status === "done"
                                ? "text-green-500 dark:text-green-400"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {isTaskOverdue ? (
                              <AlertCircle className="h-4 w-4 mr-1" />
                            ) : task.status === "done" ? (
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                            ) : (
                              <Calendar className="h-4 w-4 mr-1" />
                            )}
                            <span>{formatDate(task.dueDate)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            No due date
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => handleEditTask(e, task)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          <span>View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      
      {/* Task Detail Dialog */}
      {selectedTask && (
        <>
          <TaskDetailDialog
            task={selectedTask}
            open={isDetailOpen}
            onClose={() => {
              setIsDetailOpen(false);
              setSelectedTask(null);
            }}
          />
          
          <EditTaskDialog
            open={isEditOpen}
            onOpenChange={(open) => {
              setIsEditOpen(open);
              if (!open) setSelectedTask(null);
            }}
            task={selectedTask}
          />
        </>
      )}
    </div>
  );
}