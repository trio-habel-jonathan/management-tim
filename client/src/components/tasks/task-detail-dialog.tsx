import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { 
  CalendarIcon, 
  CheckCircle2Icon,
  ClockIcon, 
  AlignLeftIcon, 
  UserIcon,
  TagIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskComments } from "@/components/tasks/task-comments";
import { Separator } from "@/components/ui/separator";

// Task interface
interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  assigneeId?: number;
  assignee?: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    avatar?: string;
  };
  projectId: number;
  createdAt: string;
  order: number;
}

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

export function TaskDetailDialog({ task, open, onClose }: TaskDetailDialogProps) {
  if (!task) return null;

  // Priority color mapping
  const priorityColorMap: Record<string, string> = {
    high: "bg-red-500/10 text-red-500 border-red-200",
    medium: "bg-orange-500/10 text-orange-500 border-orange-200",
    low: "bg-green-500/10 text-green-500 border-green-200",
  };
  
  // Status color mapping
  const statusColorMap: Record<string, string> = {
    todo: "bg-slate-500/10 text-slate-500 border-slate-200",
    "in-progress": "bg-blue-500/10 text-blue-500 border-blue-200",
    "in-review": "bg-purple-500/10 text-purple-500 border-purple-200",
    done: "bg-green-500/10 text-green-500 border-green-200",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {task.status === "done" && (
              <CheckCircle2Icon className="h-5 w-5 text-green-500" />
            )}
            {task.title}
          </DialogTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className={statusColorMap[task.status] || ""}>
              {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace("-", " ")}
            </Badge>
            <Badge variant="outline" className={priorityColorMap[task.priority] || ""}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid gap-4">
          {task.description && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                <AlignLeftIcon className="h-4 w-4" />
                <span>Description</span>
              </div>
              <div className="text-sm whitespace-pre-wrap">
                {task.description}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {task.assignee && (
              <div className="flex items-start gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Assignee</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage 
                        src={task.assignee.avatar} 
                        alt={task.assignee.fullName || task.assignee.username} 
                      />
                      <AvatarFallback>
                        {(task.assignee.fullName || task.assignee.username).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{task.assignee.fullName || task.assignee.username}</span>
                  </div>
                </div>
              </div>
            )}

            {task.dueDate && (
              <div className="flex items-start gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Due Date</div>
                  <div className="text-sm mt-1">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <ClockIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">Created</div>
                <div className="text-sm mt-1">
                  {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Comments section */}
          {task.id && <TaskComments taskId={task.id} />}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}