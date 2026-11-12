"use client";

interface Props {
  data: { date: string; count: number }[];
}

export function ReviewHeatmap({ data }: Props) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  function getColor(count: number): string {
    if (count === 0) return "bg-muted";
    const intensity = count / maxCount;
    if (intensity < 0.25) return "bg-green-900/40";
    if (intensity < 0.5) return "bg-green-700/60";
    if (intensity < 0.75) return "bg-green-600/80";
    return "bg-green-500";
  }

  // Arrange into weeks (columns) with 7 rows (Mon-Sun)
  const firstDate = new Date(data[0].date);
  const firstDow = (firstDate.getDay() + 6) % 7; // Mon=0
  const padded = Array(firstDow).fill(null).concat(data);
  const weeks: (typeof data[0] | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }
  // Pad last week
  while (weeks[weeks.length - 1].length < 7) {
    weeks[weeks.length - 1].push(null);
  }

  const dayLabels = ["Mon", "", "Wed", "", "Fri", "", ""];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 pt-0 pr-1">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-[14px] text-[10px] text-muted-foreground leading-[14px]">
              {label}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                className={`size-[14px] rounded-sm ${day ? getColor(day.count) : ""}`}
                title={day ? `${day.date}: ${day.count} reviews` : ""}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
