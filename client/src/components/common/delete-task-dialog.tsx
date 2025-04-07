import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Task } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
}

export function DeleteTaskDialog({
  open,
  onOpenChange,
  task,
}: DeleteTaskDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/tasks/${task.id}`, { method: "DELETE" });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      if (task.projectId) {
        queryClient.invalidateQueries({
          queryKey: [`/api/tasks?projectId=${task.projectId}`],
        });
      }
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete task",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });

  function handleDelete() {
    deleteTaskMutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Task</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this task? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 my-2 bg-gray-100 dark:bg-gray-800 rounded-md">
          <h3 className="font-medium">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
              {task.description}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteTaskMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={deleteTaskMutation.isPending}
          >
            {deleteTaskMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Task"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}