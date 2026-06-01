import { cn } from "@/lib/utils";

const CONFIG = {
  learner: { label: "Partie apprenant", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  teacher: { label: "Partie professeur", cls: "bg-primary/8 text-primary border-primary/20" },
  parent: { label: "Partie parent", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  required: { label: "Obligatoire", cls: "bg-red-50 text-red-600 border-red-200" },
  recommended: { label: "Recommandé", cls: "bg-secondary text-muted-foreground border-border" },
  optional: { label: "Optionnel", cls: "bg-secondary text-muted-foreground border-border" },
  reliability: { label: "Améliore la fiabilité", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export default function RespondentBadge({ type, className }) {
  const c = CONFIG[type] || { label: type, cls: "bg-secondary text-secondary-foreground border-border" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", c.cls, className)}>
      {c.label}
    </span>
  );
}