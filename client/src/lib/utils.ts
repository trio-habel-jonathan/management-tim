import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, "h:mm a")}`;
  } else if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, "h:mm a")}`;
  } else {
    return format(dateObj, "MMM d, yyyy 'at' h:mm a");
  }
}

export const generateAvatar = (name: string) => {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
};

export function getInitials(name: string) {
  const parts = name.split(" ");
  let initials = "";
  
  if (parts.length === 1) {
    initials = parts[0].substring(0, 2);
  } else {
    parts.forEach((part, index) => {
      if (index < 2) initials += part.charAt(0);
    });
  }
  
  return initials.toUpperCase();
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'todo':
      return 'bg-blue-100 text-primary dark:bg-blue-900 dark:text-blue-300';
    case 'in progress':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    case 'review':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    case 'complete':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

export function getPriorityColor(priority: string) {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    case 'medium':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
    case 'low':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function isOverdue(dueDate: Date | string | null | undefined): boolean {
  if (!dueDate) return false;
  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  return date < new Date();
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
