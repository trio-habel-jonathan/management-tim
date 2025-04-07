import { ReactNode } from "react";
import { Sidebar } from "./sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-dark">
      <Sidebar />
      <main className="flex-1 lg:pl-64 pt-16 lg:pt-0">
        <div className="px-4 py-6">{children}</div>
      </main>
    </div>
  );
}