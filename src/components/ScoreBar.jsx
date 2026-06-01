import { cn } from "@/lib/utils";
import LevelBadge from "./LevelBadge";

export default function ScoreBar({ label, level, score, className }) {
  const pct = score != null ? Math.max(0, Math.min(100, score)) : null;

  return (
    <div className={cn("flex items-center justify-between gap-4 py-2.5 border-b border-border last:border-0", className)}>
      <span className="text-sm flex-1">{label}</span>
      <div className="flex items-center gap-3">
        {pct != null && (
          <div className="w-20 h-1.5 rounded-full bg-border hidden sm:block">
            <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
        <LevelBadge level={level} />
      </div>
    </div>
  );
}