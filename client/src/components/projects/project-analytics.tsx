import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TIME_PERIODS, TASK_STATUSES } from "@/lib/constants";
import { Task } from "@shared/schema";
import { format, subDays, isAfter } from "date-fns";

interface ProjectAnalyticsProps {
  projectId: number;
}

export function ProjectAnalytics({ projectId }: ProjectAnalyticsProps) {
  const [timePeriod, setTimePeriod] = useState("7d");
  const [chartType, setChartType] = useState("progress");
  
  // Fetch tasks for the project
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: [`/api/tasks?projectId=${projectId}`],
    enabled: !!projectId,
  });
  
  // Filter tasks based on time period
  const getFilteredTasks = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (timePeriod) {
      case "7d":
        startDate = subDays(now, 7);
        break;
      case "30d":
        startDate = subDays(now, 30);
        break;
      case "90d":
        startDate = subDays(now, 90);
        break;
      default:
        startDate = subDays(now, 7);
    }
    
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate || task.dueDate || new Date());
      return isAfter(taskDate, startDate) || taskDate.getTime() === startDate.getTime();
    });
  };
  
  const filteredTasks = getFilteredTasks();
  
  // Calculate project progress
  const calculateProgress = () => {
    if (!filteredTasks.length) return { completion: 0, inProgress: 0, todo: 0 };
    
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => task.status === "done").length;
    const inProgressTasks = filteredTasks.filter(task => 
      task.status === "in-progress" || task.status === "in-review"
    ).length;
    const todoTasks = filteredTasks.filter(task => task.status === "todo").length;
    
    const completion = Math.round((completedTasks / totalTasks) * 100);
    const inProgress = Math.round((inProgressTasks / totalTasks) * 100);
    const todo = Math.round((todoTasks / totalTasks) * 100);
    
    return { completion, inProgress, todo };
  };
  
  const { completion, inProgress, todo } = calculateProgress();
  
  // Data for task status distribution
  const statusData = TASK_STATUSES.map(status => {
    const count = filteredTasks.filter(task => task.status === status.value).length;
    return {
      name: status.label,
      value: count,
    };
  }).filter(item => item.value > 0);
  
  // Data for task priority distribution
  const priorityData = [
    {
      name: "High",
      value: filteredTasks.filter(task => task.priority === "high").length,
    },
    {
      name: "Medium",
      value: filteredTasks.filter(task => task.priority === "medium").length,
    },
    {
      name: "Low",
      value: filteredTasks.filter(task => task.priority === "low").length,
    },
  ].filter(item => item.value > 0);
  
  // Data for daily progress chart
  const getDailyProgressData = () => {
    const daysToShow = timePeriod === "7d" ? 7 : timePeriod === "30d" ? 30 : 90;
    const data = [];
    
    for (let i = 0; i < daysToShow; i++) {
      const date = subDays(new Date(), daysToShow - i - 1);
      const formattedDate = format(date, "MMM dd");
      
      const completedTasksCount = filteredTasks.filter(task => {
        if (task.status === "done") {
          const dueDate = new Date(task.dueDate || new Date());
          return format(dueDate, "MMM dd") === formattedDate;
        }
        return false;
      }).length;
      
      const totalTasksCount = filteredTasks.filter(task => {
        const dueDate = new Date(task.dueDate || new Date());
        return format(dueDate, "MMM dd") === formattedDate;
      }).length;
      
      data.push({
        name: formattedDate,
        completed: completedTasksCount,
        total: totalTasksCount,
      });
    }
    
    return data;
  };
  
  const dailyProgressData = getDailyProgressData();
  
  // Colors for charts
  const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <CardTitle>Project Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <p>Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Project Analytics</h3>
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-3xl font-bold">{completion}%</div>
                <div className="text-xs text-muted-foreground">
                  {filteredTasks.filter(task => task.status === "done").length} of {filteredTasks.length} tasks
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border-8 border-blue-500 dark:border-blue-600" style={{ borderRightColor: 'transparent' }}></div>
            </div>
            <Progress value={completion} className="h-2 mt-4" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-3xl font-bold">{inProgress}%</div>
                <div className="text-xs text-muted-foreground">
                  {filteredTasks.filter(task => 
                    task.status === "in-progress" || task.status === "in-review"
                  ).length} of {filteredTasks.length} tasks
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border-8 border-orange-500 dark:border-orange-600" style={{ borderRightColor: 'transparent' }}></div>
            </div>
            <Progress value={inProgress} className="h-2 mt-4 bg-orange-100 dark:bg-orange-900" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">To Do</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-3xl font-bold">{todo}%</div>
                <div className="text-xs text-muted-foreground">
                  {filteredTasks.filter(task => task.status === "todo").length} of {filteredTasks.length} tasks
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border-8 border-gray-400 dark:border-gray-500" style={{ borderRightColor: 'transparent' }}></div>
            </div>
            <Progress value={todo} className="h-2 mt-4 bg-gray-200 dark:bg-gray-700" />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle>Task Analysis</CardTitle>
            <Tabs value={chartType} onValueChange={setChartType}>
              <TabsList className="grid grid-cols-3 w-[400px]">
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="priority">Priority</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <TabsContent value="progress" className="mt-0 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyProgressData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#94A3B8" name="Total Tasks" />
                  <Bar dataKey="completed" fill="#2563EB" name="Completed Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="status" className="mt-0 h-full">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="priority" className="mt-0 h-full">
              {priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#EF4444" /> {/* High - Red */}
                      <Cell fill="#F59E0B" /> {/* Medium - Orange */}
                      <Cell fill="#10B981" /> {/* Low - Green */}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
            </TabsContent>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}