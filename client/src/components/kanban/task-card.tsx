import { useState } from "react";
import { useDrag } from "react-dnd";
import { Task, User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import {
  MoreHorizontal,
  Calendar,
  CheckCircle,
  AlertCircle,
  Pencil,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { TASK_CATEGORIES } from "@/lib/constants";
import { cn, getInitials, truncate, isOverdue, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EditTaskDialog } from "@/components/common/edit-task-dialog";
import { DeleteTaskDialog } from "@/components/common/delete-task-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Set up drag source
  const [{ isDragging }, drag] = useDrag({
    type: "task",
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  // Get assignee if exists
  const { data: assignee, isLoading: isLoadingAssignee } = useQuery<User>({
    queryKey: [`/api/users/${task.assigneeId}`],
    enabled: !!task.assigneeId,
  });

  // Get prioritized tag if any
  const primaryTag = task.tags?.length ? task.tags[0] : null;
  const tagColor = primaryTag
    ? TASK_CATEGORIES.find((cat) => cat.value === primaryTag)?.color || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
    : "";

  // Check if task is overdue
  const taskIsOverdue = task.dueDate ? isOverdue(task.dueDate) : false;
  
  // Get comment count for task
  const { data: comments = [] } = useQuery({
    queryKey: [`/api/tasks/${task.id}/comments`],
    enabled: !!task.id,
  });
  
  const commentCount = comments.length;

  return (
    <>
      <div
        ref={drag}
        className={cn(
          "drag-item bg-white dark:bg-dark shadow-card hover:shadow-cardHover rounded-md p-3 cursor-grab",
          isDragging && "opacity-50"
        )}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        onClick={() => setIsDetailOpen(true)}
      >
        <div className="flex justify-between items-start mb-2">
          {primaryTag ? (
            <Badge className={tagColor} variant="outline">
              {primaryTag}
            </Badge>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              No tag
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                onClick={(e) => e.stopPropagation()} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setIsEditOpen(true);
              }}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setIsDetailOpen(true);
              }}>
                <MessageSquare className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 dark:text-red-400" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {task.title}
        </h4>

        {task.description && (
          <p
            className="text-xs text-gray-500 dark:text-gray-400 mb-3 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowFullDescription(!showFullDescription);
            }}
          >
            {showFullDescription
              ? task.description
              : truncate(task.description, 100)}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLoadingAssignee ? (
              <Skeleton className="h-6 w-6 rounded-full" />
            ) : assignee ? (
              <Avatar className="h-6 w-6">
                <AvatarImage src={assignee.avatar} />
                <AvatarFallback className="text-xs">
                  {getInitials(assignee.fullName)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">NA</AvatarFallback>
              </Avatar>
            )}
            
            {commentCount > 0 && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-3 w-3 mr-1" />
                <span>{commentCount}</span>
              </div>
            )}
          </div>

          {task.dueDate && (
            <div
              className={cn(
                "flex items-center text-xs",
                taskIsOverdue
                  ? "text-red-500"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              {taskIsOverdue ? (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  <span>Overdue</span>
                </>
              ) : task.status === "complete" ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1 text-secondary" />
                  <span className="text-secondary">Completed</span>
                </>
              ) : (
                <>
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{formatDate(task.dueDate)}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Task Dialog */}
      {isEditOpen && (
        <EditTaskDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          task={task}
        />
      )}

      {/* Delete Task Dialog */}
      {isDeleteOpen && (
        <DeleteTaskDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          task={task}
        />
      )}
      
      {/* Task Detail Dialog with Comments */}
      <TaskDetailDialog
        task={task}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </>
  );
}
