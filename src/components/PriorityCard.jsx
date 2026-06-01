import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PriorityCard({ priority, index, className }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("bg-card border border-border rounded-lg overflow-hidden", className)}>
      <button onClick={() => setOpen(!open)} className="w-full text-left px-5 py-4 flex items-start gap-3">
        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 font-semibold mt-0.5">
          {index + 1}
        </span>
        <div className="flex-1">
          <p className="font-medium text-sm">{priority.title}</p>
          {priority.reason && !open && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{priority.reason}</p>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-border bg-secondary/20">
          {priority.reason && (
            <div className="pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Pourquoi</p>
              <p className="text-sm">{priority.reason}</p>
            </div>
          )}
          {priority.actions?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Actions recommandées</p>
              <ul className="space-y-1">
                {priority.actions.map((a, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-0.5">·</span>{a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {priority.indicator && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Indicateur de progression</p>
              <p className="text-sm text-primary">{priority.indicator}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}