import { cn } from "@/lib/utils";

const STATUS_MAP = {
  draft: { label: "Brouillon", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  in_progress: { label: "En cours", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Terminé", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  archived: { label: "Archivé", cls: "bg-gray-100 text-gray-500 border-gray-200" },
  active: { label: "Actif", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  inactive: { label: "Inactif", cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, cls: "bg-secondary text-secondary-foreground border-border" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", s.cls)}>
      {s.label}
    </span>
  );
}