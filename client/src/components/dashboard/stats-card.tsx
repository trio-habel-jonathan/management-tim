import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
  };
}

export function StatsCard({
  title,
  value,
  icon,
  iconBgColor,
  change,
}: StatsCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconBgColor)}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                {value}
              </div>
              {change && (
                <div
                  className={cn(
                    "ml-2 flex items-baseline text-sm font-semibold",
                    change.trend === "up"
                      ? "text-green-600 dark:text-green-500"
                      : change.trend === "down"
                      ? "text-red-600 dark:text-red-500"
                      : "text-yellow-600 dark:text-yellow-500"
                  )}
                >
                  {change.trend === "up" ? (
                    <ArrowUp className="mr-0.5 h-4 w-4" />
                  ) : change.trend === "down" ? (
                    <ArrowDown className="mr-0.5 h-4 w-4" />
                  ) : (
                    <Minus className="mr-0.5 h-4 w-4" />
                  )}
                  <span>{change.value}%</span>
                </div>
              )}
            </dd>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
