import { useState, useEffect } from "react";
import { entities, setSessionToken } from "@/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Printer, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "../components/EmptyState";

function ReportCard({ report, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(report.report_content_text || "");
  const [saving, setSaving] = useState(false);

  const typeLabels = { teacher: "Professeur", parent: "Parent", learner: "Apprenant" };
  const statusConfig = {
    ready: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Prêt" },
    draft: { cls: "bg-amber-50 text-amber-700 border-amber-200", label: "Brouillon" },
    exported: { cls: "bg-blue-50 text-blue-700 border-blue-200", label: "Exporté" },
  };
  const sc = statusConfig[report.export_status] || statusConfig.draft;

  const handleSave = async () => {
    setSaving(true);
    const updated = await entities.Report.update(report.id, {
      report_content_text: editedText,
      export_status: "ready",
      last_updated_at: new Date().toISOString(),
    });
    onUpdate(updated);
    setEditing(false);
    setSaving(false);
    toast.success("Rapport enregistré.");
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>${report.report_title || "Rapport STEM Compass"}</title>
        <style>
          body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #1a1a1a; line-height: 1.7; }
          h1 { font-size: 1.4rem; border-bottom: 2px solid #2d6a7f; padding-bottom: 10px; margin-bottom: 20px; }
          pre { white-space: pre-wrap; font-family: inherit; font-size: 0.9rem; }
          .footer { margin-top: 40px; font-size: 0.75rem; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
          @media print { body { margin: 20px; } button { display: none; } }
        </style>
      </head>
      <body>
        <h1>${report.report_title || "Rapport STEM Compass"}</h1>
        <pre>${editedText}</pre>
        <div class="footer">STEM Compass — Synthèse pédagogique, non officielle · ${new Date().toLocaleDateString("fr-FR")}</div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `);
    win.document.close();
    entities.Report.update(report.id, { export_status: "exported" });
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-medium text-sm">{report.report_title || "Rapport"}</p>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary border border-border font-medium">{typeLabels[report.report_type] || report.report_type}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${sc.cls}`}>{sc.label}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Généré le {report.generated_at ? new Date(report.generated_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }) : "—"}
            {report.last_updated_at && report.last_updated_at !== report.generated_at ? ` · Modifié le ${new Date(report.last_updated_at).toLocaleDateString("fr-FR")}` : ""}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {!editing ? (
            <>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setEditing(true)}>
                <Edit2 className="h-3.5 w-3.5" />Modifier
              </Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5" />Imprimer / PDF
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setEditedText(report.report_content_text || ""); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" className="gap-1" onClick={handleSave} disabled={saving}>
                <Save className="h-3.5 w-3.5" />{saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="border-t border-border px-5 py-4 bg-secondary/10">
          <p className="text-xs text-muted-foreground mb-2">Modifiez le rapport. Ces changements seront sauvegardés et utilisés à l'export.</p>
          <Textarea
            value={editedText}
            onChange={e => setEditedText(e.target.value)}
            rows={20}
            className="font-mono text-xs leading-relaxed"
          />
        </div>
      ) : (
        <div className="border-t border-border px-5 py-4 bg-secondary/20">
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
            {editedText || "Aucun contenu généré."}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    entities.Report.list("-created_date", 100).then(setReports).finally(() => setLoading(false));
  }, []);

  const handleUpdate = (updated) => {
    setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const teacherReports = reports.filter(r => r.report_type === "teacher");
  const parentReports = reports.filter(r => r.report_type === "parent");
  const learnerReports = reports.filter(r => r.report_type === "learner");

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Rapports</h1>
        <p className="text-sm text-muted-foreground">{reports.length} rapport(s)</p>
      </div>

      <div className="bg-secondary/40 border border-border rounded-lg p-4 text-sm text-muted-foreground">
        Les rapports sont générés depuis la page <strong>Résultats</strong> d'un diagnostic. Vous pouvez modifier chaque rapport avant de l'exporter. Le bouton <strong>Imprimer / PDF</strong> ouvre une version imprimable propre.
      </div>

      <Tabs defaultValue="teacher">
        <TabsList>
          <TabsTrigger value="teacher">Professeur ({teacherReports.length})</TabsTrigger>
          <TabsTrigger value="parent">Parent ({parentReports.length})</TabsTrigger>
          <TabsTrigger value="learner">Apprenant ({learnerReports.length})</TabsTrigger>
        </TabsList>

        {[
          { value: "teacher", list: teacherReports, empty: "Aucun rapport professeur. Générez-en un depuis la page Résultats d'un diagnostic." },
          { value: "parent", list: parentReports, empty: "Aucun rapport parent. Disponible pour les diagnostics enfant et adolescent." },
          { value: "learner", list: learnerReports, empty: "Aucun rapport apprenant. Disponible après un diagnostic calculé et validé." },
        ].map(({ value, list, empty }) => (
          <TabsContent key={value} value={value} className="mt-6">
            {list.length === 0 ? (
              <EmptyState icon={FileText} title="Aucun rapport" description={empty} />
            ) : (
              <div className="space-y-4">
                {list.map(r => <ReportCard key={r.id} report={r} onUpdate={handleUpdate} />)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}