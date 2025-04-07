import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "@/components/kanban/board";
import { CreateTaskDialog } from "@/components/common/create-task-dialog";
import { Task } from "@shared/schema";
import { Plus, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn, getStatusColor, getPriorityColor, isOverdue } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTable } from "@/components/ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

export default function TasksPage() {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("board");

  // Fetch tasks
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Fetch users for assignee information
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  // Get upcoming tasks due in the next 7 days
  const upcomingTasks = tasks
    ?.filter(
      (task) =>
        task.status !== "complete" &&
        task.dueDate &&
        new Date(task.dueDate) > new Date() &&
        new Date(task.dueDate) <
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    )
    .sort(
      (a, b) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    );

  // Get overdue tasks
  const overdueTasks = tasks?.filter(
    (task) =>
      task.status !== "complete" &&
      task.dueDate &&
      new Date(task.dueDate) < new Date()
  );

  // Task table columns
  const columns = [
    {
      accessorKey: "title",
      header: "Task",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div>
            <div className="font-medium">{task.title}</div>
            {task.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                {task.description}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge className={getStatusColor(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as string;
        return (
          <Badge className={getPriorityColor(priority)}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "assigneeId",
      header: "Assignee",
      cell: ({ row }) => {
        const assigneeId = row.getValue("assigneeId") as number;
        const assignee = users?.find((user) => user.id === assigneeId);
        
        if (!assignee) return "Unassigned";
        
        return (
          <div className="flex items-center">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={assignee.avatar} />
              <AvatarFallback>{getInitials(assignee.fullName)}</AvatarFallback>
            </Avatar>
            <span>{assignee.fullName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const dueDate = row.getValue("dueDate") as string;
        if (!dueDate) return "No due date";
        
        const formattedDate = format(new Date(dueDate), "MMM d, yyyy");
        const taskIsOverdue = isOverdue(dueDate);
        
        return (
          <div className={cn("flex items-center", taskIsOverdue && "text-red-500")}>
            {taskIsOverdue ? <Clock className="h-4 w-4 mr-1" /> : <Calendar className="h-4 w-4 mr-1" />}
            <span>{formattedDate}</span>
          </div>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-inter">
          Tasks
        </h1>
        <Button
          onClick={() => setIsCreateTaskOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
        
        <TabsContent value="board" className="mt-0">
          <KanbanBoard />
        </TabsContent>
        
        <TabsContent value="list" className="mt-0">
          <Card>
            <CardContent className="p-6">
              {tasks && tasks.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={tasks}
                  searchColumn="title"
                  searchPlaceholder="Search tasks..."
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No tasks found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Start by creating your first task.</p>
                  <Button onClick={() => setIsCreateTaskOpen(true)}>
                    Create Task
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="upcoming" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingTasks && upcomingTasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-yellow-600 dark:text-yellow-500">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{format(new Date(task.dueDate!), "MMM d, yyyy")}</span>
                          </div>
                        </TableCell>
                        <TableCell>Project Name</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No upcoming tasks</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    You don't have any tasks due in the next 7 days.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="overdue" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overdue Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {overdueTasks && overdueTasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-red-600 dark:text-red-500">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{format(new Date(task.dueDate!), "MMM d, yyyy")}</span>
                          </div>
                        </TableCell>
                        <TableCell>Project Name</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No overdue tasks</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Great job! You don't have any overdue tasks.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
      />
    </MainLayout>
  );
}
