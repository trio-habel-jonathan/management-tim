import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TIME_PERIODS } from "@/lib/constants";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { ArrowUp, ArrowDown } from "lucide-react";

interface ProjectProgressCardProps {
  projectId?: number;
}

export function ProjectProgressCard({ projectId }: ProjectProgressCardProps) {
  const [timePeriod, setTimePeriod] = useState("7d");

  const { data: tasks, isLoading } = useQuery({
    queryKey: [projectId ? `/api/tasks?projectId=${projectId}` : "/api/tasks"],
    enabled: projectId !== undefined || true,
  });

  // Calculate project progress
  const calculateProgress = () => {
    if (!tasks || tasks.length === 0) return { completion: 0, sprint: 0 };
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === "complete").length;
    const inProgressTasks = tasks.filter(task => ["in progress", "review"].includes(task.status)).length;
    
    const completion = Math.round((completedTasks / totalTasks) * 100);
    const sprint = Math.round(((completedTasks + (inProgressTasks * 0.5)) / totalTasks) * 100);
    
    return { completion, sprint };
  };

  const { completion, sprint } = calculateProgress();

  // Mock data for the chart
  const progressData = [
    { name: "Mon", completion: 25, tasks: 5 },
    { name: "Tue", completion: 38, tasks: 8 },
    { name: "Wed", completion: 45, tasks: 12 },
    { name: "Thu", completion: 52, tasks: 15 },
    { name: "Fri", completion: 58, tasks: 18 },
    { name: "Sat", completion: 61, tasks: 20 },
    { name: "Sun", completion: 64, tasks: 22 },
  ];

  // Analytics data
  const analytics = [
    { 
      title: "Tasks Completed", 
      value: tasks ? tasks.filter(task => task.status === "complete").length : 0,
      change: { value: 12.3, trend: "up" as const }
    },
    { 
      title: "Hours Tracked", 
      value: "164h",
      change: { value: 8.7, trend: "up" as const }
    },
    { 
      title: "Overdue Tasks", 
      value: tasks ? tasks.filter(task => task.status !== "complete" && new Date(task.dueDate) < new Date()).length : 0,
      change: { value: 5.2, trend: "down" as const }
    }
  ];

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 dark:border-dark-darker flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-lg font-semibold font-inter">
          Project Progress
        </CardTitle>
        <div className="mt-2 sm:mt-0">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-dark rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Task Completion Rate
              </h3>
              <span className="text-lg font-semibold text-secondary">
                {isLoading ? <Skeleton className="h-6 w-12" /> : `${completion}%`}
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-2 w-full" />
            ) : (
              <Progress value={completion} className="h-2" indicatorColor="bg-secondary" />
            )}
          </div>

          <div className="bg-gray-50 dark:bg-dark rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sprint Progress
              </h3>
              <span className="text-lg font-semibold text-primary">
                {isLoading ? <Skeleton className="h-6 w-12" /> : `${sprint}%`}
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-2 w-full" />
            ) : (
              <Progress value={sprint} className="h-2" />
            )}
          </div>
        </div>

        <div className="h-64 mb-4">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={progressData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(31, 41, 55, 0.8)',
                    border: 'none',
                    borderRadius: '0.375rem',
                    color: '#F9FAFB'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="completion"
                  stroke="#2563EB"
                  activeDot={{ r: 8 }}
                />
                <Line type="monotone" dataKey="tasks" stroke="#10B981" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {analytics.map((item, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-dark rounded-lg p-3 text-center"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {item.title}
              </p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {isLoading ? <Skeleton className="h-7 w-10 mx-auto" /> : item.value}
              </p>
              {!isLoading && (
                <p
                  className={`text-xs ${
                    item.change.trend === "up"
                      ? "text-green-600 dark:text-green-500"
                      : "text-red-600 dark:text-red-500"
                  } mt-1 flex items-center justify-center`}
                >
                  {item.change.trend === "up" ? (
                    <ArrowUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-0.5" />
                  )}
                  <span>{item.change.value}% from last week</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
