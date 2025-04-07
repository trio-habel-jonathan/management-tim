import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateTaskDialog } from "@/components/common/create-task-dialog";
import { Task } from "@shared/schema";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { cn, getStatusColor } from "@/lib/utils";

export default function CalendarPage() {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");

  // Fetch tasks
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Handler for creating a task with a preselected date
  const handleCreateTask = (date?: Date) => {
    // Would pass the date to the dialog
    setIsCreateTaskOpen(true);
  };

  // Navigate to previous period
  const navigatePrev = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === "week") {
      // Subtract 7 days
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      // Subtract 1 day
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  // Navigate to next period
  const navigateNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === "week") {
      // Add 7 days
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      // Add 1 day
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  // Navigate to today
  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Generate days for the month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Get tasks for a specific day
  const getTasksForDay = (day: Date) => {
    return tasks?.filter((task) => {
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), day);
    }) || [];
  };

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-inter">
            Calendar
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToday}
          >
            Today
          </Button>
          
          <div className="flex items-center rounded-md border">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={navigatePrev}
              className="border-r rounded-r-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={navigateNext}
              className="rounded-l-none"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Select
            value={view}
            onValueChange={(value) => setView(value as "month" | "week" | "day")}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={() => handleCreateTask()}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Calendar header */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold">
          {view === "month"
            ? format(currentDate, "MMMM yyyy")
            : view === "week"
            ? `${format(startOfWeek(currentDate), "MMM d")} - ${format(
                endOfWeek(currentDate),
                "MMM d, yyyy"
              )}`
            : format(currentDate, "EEEE, MMMM d, yyyy")}
        </h2>
      </div>

      {/* Month View */}
      {view === "month" && (
        <div className="grid grid-cols-7 gap-1">
          {/* Days of the week */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="h-10 flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, dayIdx) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <div
                key={dayIdx}
                className={cn(
                  "min-h-28 p-1 border border-gray-200 dark:border-gray-800",
                  !isCurrentMonth && "bg-gray-50 dark:bg-gray-900",
                  isToday(day) && "bg-blue-50 dark:bg-blue-900/20",
                  "overflow-hidden"
                )}
              >
                <div className="flex flex-col h-full">
                  <div
                    className={cn(
                      "calendar-day-header flex justify-between items-center p-1",
                      isToday(day) && "font-bold text-primary"
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm",
                        !isCurrentMonth && "text-gray-400 dark:text-gray-600"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 rounded-full"
                      onClick={() => handleCreateTask(day)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "text-xs p-1 mb-1 rounded truncate",
                          getStatusColor(task.status)
                        )}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 p-1">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Week View */}
      {view === "week" && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {eachDayOfInterval({
                start: startOfWeek(currentDate),
                end: endOfWeek(currentDate),
              }).map((day, index) => (
                <div key={index} className="border rounded-md p-2">
                  <div
                    className={cn(
                      "text-center p-2 font-medium",
                      isToday(day) && "bg-primary/10 text-primary rounded-md"
                    )}
                  >
                    <div>{format(day, "EEE")}</div>
                    <div>{format(day, "d")}</div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {getTasksForDay(day).map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "text-xs p-2 rounded",
                          getStatusColor(task.status)
                        )}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day View */}
      {view === "day" && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col space-y-2">
              <div
                className={cn(
                  "text-center p-2 font-medium",
                  isToday(currentDate) && "bg-primary/10 text-primary rounded-md"
                )}
              >
                <div className="text-lg">{format(currentDate, "EEEE")}</div>
                <div>{format(currentDate, "MMMM d, yyyy")}</div>
              </div>
              
              <div className="mt-4 space-y-2">
                <h3 className="font-medium">Tasks</h3>
                <div className="space-y-2">
                  {getTasksForDay(currentDate).length > 0 ? (
                    getTasksForDay(currentDate).map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "p-3 rounded-md",
                          getStatusColor(task.status)
                        )}
                      >
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-sm mt-1">{task.description}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No tasks scheduled for this day
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
      />
    </MainLayout>
  );
}
