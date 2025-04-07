// Status options for tasks
export const TASK_STATUSES = [
  { label: "To Do", value: "todo" },
  { label: "In Progress", value: "in progress" },
  { label: "Review", value: "review" },
  { label: "Complete", value: "complete" }
];

// Priority options for tasks
export const TASK_PRIORITIES = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" }
];

// Team member roles
export const TEAM_ROLES = [
  { label: "Admin", value: "admin", description: "Full access to all features, can manage team members and settings" },
  { label: "Member", value: "member", description: "Can create and edit projects, tasks, and contribute to team activities" },
  { label: "Guest", value: "guest", description: "View-only access to projects and tasks, cannot edit or create new content" }
];

// Categories for task labels
export const TASK_CATEGORIES = [
  { label: "Design", value: "design", color: "bg-blue-100 text-primary dark:bg-blue-900 dark:text-blue-300" },
  { label: "Frontend", value: "frontend", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  { label: "Backend", value: "backend", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  { label: "Research", value: "research", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  { label: "Bug", value: "bug", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  { label: "Documentation", value: "documentation", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" }
];

// Route definitions for navigation
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/',
  PROJECTS: '/projects',
  TASKS: '/tasks',
  CALENDAR: '/calendar',
  CHAT: '/chat',
  FILES: '/files',
  TEAMS: '/teams',
  SETTINGS: '/settings',
};

// Time periods for analytics
export const TIME_PERIODS = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" }
];

// File types that are accepted for upload
export const ACCEPTED_FILE_TYPES = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.svg'],
  DOCUMENTS: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
  ARCHIVES: ['.zip', '.rar', '.tar', '.gz'],
};

// Color options for project labels
export const PROJECT_COLORS = [
  { label: "Blue", value: "#2563EB" },
  { label: "Green", value: "#10B981" },
  { label: "Purple", value: "#6366F1" },
  { label: "Red", value: "#EF4444" },
  { label: "Yellow", value: "#F59E0B" },
  { label: "Pink", value: "#EC4899" },
  { label: "Indigo", value: "#4F46E5" },
  { label: "Teal", value: "#14B8A6" }
];

// Maximum file upload size in bytes (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Pagination limits
export const ITEMS_PER_PAGE = 10;
