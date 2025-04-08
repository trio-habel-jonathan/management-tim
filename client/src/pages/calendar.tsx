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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Project } from "@shared/schema";
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
import { cn } from "@/lib/utils";
import { PROJECT_COLORS } from "@/lib/constants";
import { Link } from "wouter";

export default function CalendarPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");

  // Fetch projects
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Show project details
  const showProjectDetails = (project: Project) => {
    setSelectedProject(project);
    setProjectDetailsOpen(true);
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

  // Get projects for a specific day
  const getProjectsForDay = (day: Date) => {
    return projects?.filter((project) => {
      if (!project.startDate && !project.dueDate) return false;
      
      // If project has a start date and due date, check if the day falls within that range
      if (project.startDate && project.dueDate) {
        const startDate = new Date(project.startDate);
        const endDate = new Date(project.dueDate);
        return (day >= startDate && day <= endDate);
      }
      
      // If project only has a start date, show it on that day
      if (project.startDate) {
        return isSameDay(new Date(project.startDate), day);
      }
      
      // If project only has a due date, show it on that day
      if (project.dueDate) {
        return isSameDay(new Date(project.dueDate), day);
      }
      
      return false;
    }) || [];
  };
  
  // Function to get random color for projects without a color
  const getProjectColor = (project: Project) => {
    if (project.color) return project.color;
    const colorIndex = project.id % PROJECT_COLORS.length;
    return PROJECT_COLORS[colorIndex];
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
            const dayProjects = getProjectsForDay(day);
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
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {dayProjects.slice(0, 3).map((project) => (
                      <div
                        key={project.id}
                        className={cn(
                          "text-xs p-1 mb-1 rounded truncate cursor-pointer hover:opacity-80",
                          "bg-opacity-70 dark:bg-opacity-70"
                        )}
                        style={{ backgroundColor: getProjectColor(project) }}
                        onClick={() => showProjectDetails(project)}
                      >
                        {project.name}
                      </div>
                    ))}
                    {dayProjects.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 p-1">
                        +{dayProjects.length - 3} more
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
                    {getProjectsForDay(day).map((project) => (
                      <div
                        key={project.id}
                        className={cn(
                          "text-xs p-2 rounded cursor-pointer hover:opacity-80",
                          "bg-opacity-70 dark:bg-opacity-70"
                        )}
                        style={{ backgroundColor: getProjectColor(project) }}
                        onClick={() => showProjectDetails(project)}
                      >
                        {project.name}
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
                <h3 className="font-medium">Projects</h3>
                <div className="space-y-2">
                  {getProjectsForDay(currentDate).length > 0 ? (
                    getProjectsForDay(currentDate).map((project) => (
                      <div
                        key={project.id}
                        className="p-3 rounded-md cursor-pointer hover:opacity-90 bg-opacity-70 dark:bg-opacity-70"
                        style={{ backgroundColor: getProjectColor(project) }}
                        onClick={() => showProjectDetails(project)}
                      >
                        <div className="font-medium">{project.name}</div>
                        {project.description && (
                          <div className="text-sm mt-1">{project.description}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No projects scheduled for this day
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Details Dialog */}
      <Dialog open={projectDetailsOpen} onOpenChange={setProjectDetailsOpen}>
        <DialogContent className="max-w-md">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProject.name}</DialogTitle>
                {selectedProject.description && (
                  <DialogDescription>{selectedProject.description}</DialogDescription>
                )}
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p>{selectedProject.startDate ? format(new Date(selectedProject.startDate), "PP") : "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p>{selectedProject.dueDate ? format(new Date(selectedProject.dueDate), "PP") : "Not set"}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button asChild>
                    <Link href={`/projects/${selectedProject.id}`}>View Project</Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
