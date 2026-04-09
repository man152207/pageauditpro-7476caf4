import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduledPost } from "@/hooks/useScheduledPosts";
import { PostCard } from "./PostCard";

interface CalendarGridProps {
  posts: ScheduledPost[];
  onDateClick: (date: Date) => void;
  onPostClick: (post: ScheduledPost) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({ posts, onDateClick, onPostClick }: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month fill
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month fill
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  const postsByDate = useMemo(() => {
    const map: Record<string, ScheduledPost[]> = {};
    posts.forEach((p) => {
      const dateKey = p.scheduled_at
        ? new Date(p.scheduled_at).toISOString().slice(0, 10)
        : p.created_at
        ? new Date(p.created_at).toISOString().slice(0, 10)
        : null;
      if (dateKey) {
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(p);
      }
    });
    return map;
  }, [posts]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border rounded-lg overflow-hidden">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-xs font-medium text-muted-foreground text-center py-2 bg-muted/30 border-b">
            {d}
          </div>
        ))}
        {calendarDays.map(({ date, isCurrentMonth }, i) => {
          const dateKey = date.toISOString().slice(0, 10);
          const dayPosts = postsByDate[dateKey] || [];
          const isToday = dateKey === today;

          return (
            <div
              key={i}
              className={cn(
                "min-h-[100px] border-b border-r p-1 cursor-pointer hover:bg-accent/30 transition-colors",
                !isCurrentMonth && "bg-muted/10 opacity-50"
              )}
              onClick={() => onDateClick(date)}
            >
              <div
                className={cn(
                  "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                  isToday && "bg-primary text-primary-foreground"
                )}
              >
                {date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayPosts.slice(0, 3).map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    compact
                    onClick={() => {
                      // stop propagation handled by the card
                      onPostClick(p);
                    }}
                  />
                ))}
                {dayPosts.length > 3 && (
                  <span className="text-[10px] text-muted-foreground pl-1">
                    +{dayPosts.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
