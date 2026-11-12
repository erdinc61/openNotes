"use client";

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ReviewChartProps {
  data: { date: string; count: number }[];
}

export function ReviewChart({ data }: ReviewChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Last 7 days</h2>
      <div className="flex items-end gap-1.5 h-20">
        {data.map((d) => {
          const pct = Math.round((d.count / max) * 100);
          const dayOfWeek = new Date(d.date + "T12:00:00").getDay();
          const isToday = d.date === new Date().toISOString().slice(0, 10);
          return (
            <div key={d.date} className="flex flex-col items-center flex-1 gap-1.5 h-full" title={`${d.date}: ${d.count} reviews`}>
              <div className="flex-1 w-full flex items-end">
                <div
                  className={`w-full rounded-t-sm transition-all ${isToday ? "bg-primary" : "bg-muted-foreground/30"}`}
                  style={{ height: d.count === 0 ? "2px" : `${pct}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground">{DAY_ABBR[dayOfWeek]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
