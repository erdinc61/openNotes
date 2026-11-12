"use client";

interface Props {
  data: { date: string; accuracy: number; total: number }[];
}

export function AccuracyChart({ data }: Props) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const firstDate = data[0]?.date ?? "";
  const lastDate = data[data.length - 1]?.date ?? "";

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-end gap-[3px] h-36 border-b border-border/50 pb-1">
        {data.map((d) => {
          const ratio = d.total > 0 ? Math.max(d.total / maxTotal, 0.08) : 0;
          const heightPx = Math.round(ratio * 136); // h-36 minus padding
          const green = d.accuracy >= 70;
          return (
            <div
              key={d.date}
              className="flex-1 min-w-0 flex flex-col items-stretch justify-end h-full relative group"
            >
              {d.total > 0 ? (
                <div
                  className={`w-full rounded-t-sm ${
                    green ? "bg-green-500/80" : "bg-orange-500/80"
                  }`}
                  style={{ height: `${heightPx}px` }}
                />
              ) : (
                <div className="w-full rounded-t-sm bg-muted/60" style={{ height: "4px" }} />
              )}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-popover border border-border text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-sm">
                <span className="font-medium">{d.date.slice(5)}</span>
                {d.total > 0 ? (
                  <span> — {d.accuracy}% ({d.total})</span>
                ) : (
                  <span className="text-muted-foreground"> — no reviews</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground pt-1.5 px-0.5">
        <span>{firstDate.slice(5)}</span>
        <span>{lastDate.slice(5)}</span>
      </div>
    </div>
  );
}
