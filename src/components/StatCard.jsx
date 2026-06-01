import { cn } from "@/lib/utils";

export default function StatCard({ label, value, icon: Icon, className }) {
  return (
    <div className={cn("bg-card border border-border rounded-lg p-5 flex items-start gap-4 transition-shadow hover:shadow-sm", className)}>
      {Icon && (
        <div className="h-10 w-10 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      )}
      <div>
        <p className="text-2xl font-semibold font-serif">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}