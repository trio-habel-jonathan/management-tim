import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertTaskSchema, type User, type Task } from "@shared/schema";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_CATEGORIES,
} from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Extend the task schema with validation
const formSchema = insertTaskSchema.omit({ dueDate: true }).extend({
  projectId: z.number().positive({ message: "Project is required" }),
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
});

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
}

export function EditTaskDialog({
  open,
  onOpenChange,
  task,
}: EditTaskDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch team members to assign the task
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: open,
  });

  // Set defaults based on the provided task
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task.title,
      description: task.description || "",
      projectId: task.projectId,
      status: task.status || "todo",
      priority: task.priority || "medium",
      assigneeId: task.assigneeId,
      tags: task.tags || [],
      order: task.order || 0,
      dueDate: task.dueDate ? task.dueDate.toString() : undefined,
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return apiRequest("/api/tasks/" + task.id, { method: "PUT", data });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      if (task.projectId) {
        queryClient.invalidateQueries({
          queryKey: [`/api/tasks?projectId=${task.projectId}`],
        });
      }
      toast({
        title: "Task updated",
        description: "Task has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update task",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    const taskData = {
      ...data,
      projectId: data.projectId,
      order: task.order || 0,
      dueDate: data.dueDate ? data.dueDate : undefined,
    };

    updateTaskMutation.mutate(taskData);
  }

  // Add or remove tags
  const toggleTag = (tag: string) => {
    const currentTags = form.getValues().tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    form.setValue("tags", newTags);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update task details.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Design homepage wireframe"
                      {...field}
                      disabled={updateTaskMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Details about the task..."
                      {...field}
                      value={field.value || ""}
                      disabled={updateTaskMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={
                      field.value ? field.value.toString() : undefined
                    }
                    disabled={updateTaskMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* We would fetch projects here */}
                      <SelectItem value="1">Project 1</SelectItem>
                      <SelectItem value="2">Project 2</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                      disabled={updateTaskMutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                      disabled={updateTaskMutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_PRIORITIES.map((priority) => (
                          <SelectItem
                            key={priority.value}
                            value={priority.value}
                          >
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                    disabled={updateTaskMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Unassigned</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                          disabled={updateTaskMutation.isPending}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? date.toISOString() : undefined)}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={() => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {TASK_CATEGORIES.map((category) => {
                      const isSelected = form
                        .getValues()
                        .tags?.includes(category.value);
                      return (
                        <Badge
                          key={category.value}
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer",
                            isSelected ? category.color : "",
                          )}
                          onClick={() => toggleTag(category.value)}
                        >
                          {category.label}
                        </Badge>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateTaskMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateTaskMutation.isPending}>
                {updateTaskMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Task"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}