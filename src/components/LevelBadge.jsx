import { cn } from "@/lib/utils";

const LEVEL_COLORS = {
  "Pré-A1": "bg-gray-100 text-gray-600 border-gray-200",
  "A1.1": "bg-blue-50 text-blue-700 border-blue-200",
  "A1": "bg-primary/8 text-primary border-primary/20",
  "A1+": "bg-teal-50 text-teal-700 border-teal-200",
  "A2-": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "A2": "bg-green-50 text-green-700 border-green-200",
  "À confirmer": "bg-amber-50 text-amber-700 border-amber-200",
};

export default function LevelBadge({ level, className }) {
  const cls = LEVEL_COLORS[level] || LEVEL_COLORS["À confirmer"];
  return (
    <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border", cls, className)}>
      {level || "À confirmer"}
    </span>
  );
}