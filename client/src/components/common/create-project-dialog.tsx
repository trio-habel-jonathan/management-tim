import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { insertProjectSchema, type Team } from "@shared/schema";
import { PROJECT_COLORS } from "@/lib/constants";
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

// Extend the project schema with validation
const formSchema = insertProjectSchema.extend({
  teamId: z.number().positive({ message: "Please select a team" }),
  startDate: z.date({ required_error: "Start date is required" }),
  dueDate: z.date().optional(),
});

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: Team[];
}

export function CreateProjectDialog({ open, onOpenChange, teams }: CreateProjectDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedColor, setSelectedColor] = useState("#2563EB");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      teamId: teams[0]?.id || 0,
      color: "#2563EB",
      startDate: new Date(),
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return apiRequest("POST", "/api/projects", data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project created",
        description: `${data.name} has been created successfully.`,
      });
      onOpenChange(false);
      setLocation(`/projects/${data.id}`);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create project",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    createProjectMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new project for your team to collaborate on.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Website Redesign" 
                      {...field} 
                      disabled={createProjectMutation.isPending}
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
                      placeholder="Brief description of the project..."
                      {...field}
                      disabled={createProjectMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="teamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                    disabled={createProjectMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teams.length === 0 ? (
                        <SelectItem value="0" disabled>
                          No teams available (Create a team first)
                        </SelectItem>
                      ) : (
                        teams.map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={createProjectMutation.isPending}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
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
                          selected={field.value}
                          onSelect={field.onChange}
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
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={createProjectMutation.isPending}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
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
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date < form.getValues().startDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Color</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_COLORS.map((color) => (
                      <div
                        key={color.value}
                        className={cn(
                          "w-8 h-8 rounded-full cursor-pointer border-2",
                          selectedColor === color.value
                            ? "border-black dark:border-white"
                            : "border-transparent"
                        )}
                        style={{ backgroundColor: color.value }}
                        onClick={() => {
                          setSelectedColor(color.value);
                          field.onChange(color.value);
                        }}
                      />
                    ))}
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
                disabled={createProjectMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createProjectMutation.isPending || teams.length === 0}
              >
                {createProjectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
