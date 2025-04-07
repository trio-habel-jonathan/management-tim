import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import ProjectsPage from "@/pages/projects";
import TasksPage from "@/pages/tasks";
import CalendarPage from "@/pages/calendar";
import ChatPage from "@/pages/chat";
import FilesPage from "@/pages/files";
import TeamsPage from "@/pages/teams";
import SettingsPage from "@/pages/settings";
import { ROUTES } from "@/lib/constants";

function Router() {
  return (
    <Switch>
      <Route path={ROUTES.LOGIN} component={LoginPage} />
      <Route path={ROUTES.REGISTER} component={RegisterPage} />
      <Route path={ROUTES.DASHBOARD} component={DashboardPage} />
      <Route path={ROUTES.PROJECTS} component={ProjectsPage} />
      <Route path="/projects/:id" component={ProjectsPage} />
      <Route path={ROUTES.TASKS} component={TasksPage} />
      <Route path={ROUTES.CALENDAR} component={CalendarPage} />
      <Route path={ROUTES.CHAT} component={ChatPage} />
      <Route path={ROUTES.FILES} component={FilesPage} />
      <Route path={ROUTES.TEAMS} component={TeamsPage} />
      <Route path={ROUTES.SETTINGS} component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
