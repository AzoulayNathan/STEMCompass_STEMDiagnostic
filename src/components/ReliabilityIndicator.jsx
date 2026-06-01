import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, Shield, AlertCircle } from "lucide-react";

const CONFIG = {
  fiable: { label: "Diagnostic fiable", icon: ShieldCheck, cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  assez_fiable: { label: "Assez fiable", icon: Shield, cls: "text-blue-700 bg-blue-50 border-blue-200" },
  partiel: { label: "Diagnostic partiel", icon: ShieldAlert, cls: "text-amber-700 bg-amber-50 border-amber-200" },
  a_confirmer: { label: "À confirmer", icon: AlertCircle, cls: "text-gray-600 bg-gray-100 border-gray-200" },
};

export default function ReliabilityIndicator({ label, className }) {
  const c = CONFIG[label] || CONFIG.a_confirmer;
  const Icon = c.icon;
  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium", c.cls, className)}>
      <Icon className="h-4 w-4" />
      {c.label}
    </div>
  );
}