import { useState } from "react";
import { useDrop } from "react-dnd";
import { TaskCard } from "@/components/kanban/task-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateTaskDialog } from "@/components/common/create-task-dialog";
import { Task } from "@shared/schema";

interface KanbanColumnProps {
  status: string;
  title: string;
  tasks: Task[];
  projectId?: number;
  onTaskMove: (taskId: number, newStatus: string, newOrder: number) => void;
}

export function KanbanColumn({ status, title, tasks, projectId, onTaskMove }: KanbanColumnProps) {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  // Set up drop target
  const [{ isOver }, drop] = useDrop({
    accept: "task",
    drop: (item: { id: number }) => {
      const newOrder = tasks.length; // Add to the end of the column
      onTaskMove(item.id, status, newOrder);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`kanban-column flex-shrink-0 w-80 rounded-lg p-3 ${
        isOver
          ? "bg-gray-200 dark:bg-gray-700"
          : "bg-gray-100 dark:bg-dark-lighter"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {title}
        </h3>
        <span className="text-xs font-medium bg-gray-200 dark:bg-dark text-gray-700 dark:text-gray-300 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      <div className="drop-zone space-y-3 min-h-[100px]">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      <Button
        variant="ghost"
        className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary p-2 w-full"
        onClick={() => setIsCreateTaskOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        <span>Add task</span>
      </Button>

      {/* Create Task Dialog */}
      {isCreateTaskOpen && (
        <CreateTaskDialog
          open={isCreateTaskOpen}
          onOpenChange={setIsCreateTaskOpen}
          projectId={projectId}
          initialStatus={status}
        />
      )}
    </div>
  );
}
