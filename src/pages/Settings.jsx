import { useState, useEffect } from "react";
import { auth } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, Building, Settings2, FileText, Shield } from "lucide-react";

const ROLES = { teacher: "Professeur / Tuteur", parent: "Parent", learner: "Apprenant", school_admin: "Administrateur école" };

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${checked ? 'bg-primary' : 'bg-border'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("teacher");
  const [prefs, setPrefs] = useState({
    defaultMode: "standard",
    parentReportForKids: true,
    oralEnabled: true,
    includeAvoidSection: true,
    includeFourWeekPlan: true,
    includeLearnerReport: true,
    includeObservations: true,
    reportFormat: "complete",
  });

  useEffect(() => {
    auth.me().then(u => {
      if (u) {
        setUser(u);
        setRole(u.role || "teacher");
      }
    });
  }, []);

  const handleSaveProfile = async () => {
    await auth.updateMe({ role });
    toast.success("Profil enregistré.");
  };

  const setPref = (key, val) => setPrefs(p => ({ ...p, [key]: val }));

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      <h1 className="font-serif text-2xl font-bold">Paramètres</h1>

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="profile" className="gap-1.5"><User className="h-3.5 w-3.5" />Profil</TabsTrigger>
          <TabsTrigger value="org" className="gap-1.5"><Building className="h-3.5 w-3.5" />Organisation</TabsTrigger>
          <TabsTrigger value="diagnostic" className="gap-1.5"><Settings2 className="h-3.5 w-3.5" />Diagnostic</TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Rapports</TabsTrigger>
          <TabsTrigger value="privacy" className="gap-1.5"><Shield className="h-3.5 w-3.5" />Confidentialité</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="font-serif font-semibold text-lg">Profil utilisateur</h2>
            <div><Label>Nom</Label><Input value={user?.full_name || ""} disabled className="mt-1 bg-secondary/40" /></div>
            <div><Label>Email</Label><Input value={user?.email || ""} disabled className="mt-1 bg-secondary/40" /></div>
            <div>
              <Label>Rôle</Label>
              <select value={role} onChange={e => setRole(e.target.value)} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <Button onClick={handleSaveProfile}>Enregistrer le profil</Button>
          </div>
        </TabsContent>

        <TabsContent value="org" className="mt-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="font-serif font-semibold text-lg">Organisation</h2>
            <div><Label>Nom de l'établissement ou de l'activité</Label><Input placeholder="ex. École bilingue Montpellier" className="mt-1" /></div>
            <div>
              <Label>Type</Label>
              <select className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="independent">Indépendant / Tuteur</option>
                <option value="school">École</option>
                <option value="tutoring_center">Centre de soutien</option>
                <option value="association">Association</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">La gestion multi-utilisateurs d'une organisation sera disponible dans une prochaine version.</p>
            <Button variant="outline" disabled>Enregistrer l'organisation</Button>
          </div>
        </TabsContent>

        <TabsContent value="diagnostic" className="mt-6 space-y-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-serif font-semibold text-lg mb-4">Préférences diagnostic</h2>
            <div className="mb-4">
              <Label>Mode par défaut</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {["express", "standard", "complete"].map(m => (
                  <button key={m} onClick={() => setPref("defaultMode", m)} className={`px-3 py-2 rounded-lg border text-sm transition-colors capitalize ${prefs.defaultMode === m ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:bg-secondary/40"}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-0">
              <ToggleRow label="Rapport parent activé par défaut pour enfants" desc="Ajoute automatiquement la partie parent pour les profils enfant." checked={prefs.parentReportForKids} onChange={v => setPref("parentReportForKids", v)} />
              <ToggleRow label="Explication optionnelle activée" desc="Inclut la tâche d'explication écrite ou orale dans les nouvelles sessions." checked={prefs.oralEnabled} onChange={v => setPref("oralEnabled", v)} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-serif font-semibold text-lg mb-4">Préférences rapports</h2>
            <div className="space-y-0">
              <ToggleRow label="Inclure le rapport apprenant" desc="Génère une version adaptée selon l'âge." checked={prefs.includeLearnerReport} onChange={v => setPref("includeLearnerReport", v)} />
              <ToggleRow label="Inclure le plan 4 semaines" checked={prefs.includeFourWeekPlan} onChange={v => setPref("includeFourWeekPlan", v)} />
              <ToggleRow label="Inclure la section « À éviter »" checked={prefs.includeAvoidSection} onChange={v => setPref("includeAvoidSection", v)} />
              <ToggleRow label="Inclure les observations professeur" checked={prefs.includeObservations} onChange={v => setPref("includeObservations", v)} />
            </div>
            <div className="mt-4">
              <Label>Format des rapports</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[{ v: "short", l: "Court" }, { v: "complete", l: "Complet" }].map(({ v, l }) => (
                  <button key={v} onClick={() => setPref("reportFormat", v)} className={`px-3 py-2 rounded-lg border text-sm transition-colors ${prefs.reportFormat === v ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:bg-secondary/40"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6 space-y-4">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="font-serif font-semibold text-lg">Confidentialité des données pédagogiques</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              {[
                { title: "Usage pédagogique uniquement", desc: "Les données saisies servent exclusivement au diagnostic pédagogique. Elles ne sont pas utilisées à des fins commerciales ou d'évaluation externe." },
                { title: "Données des mineurs", desc: "STEM Compass peut être utilisé avec des élèves mineurs. Ne collectez que des informations pédagogiques nécessaires. Le professeur est responsable du respect des règles applicables." },
                { title: "Observations pédagogiques", desc: "Les observations doivent rester factuelles, pédagogiques et respectueuses. Elles ne doivent pas contenir d'informations personnelles non pertinentes." },
                { title: "Partage des rapports", desc: "Les rapports sont des outils pédagogiques. Leur partage doit se faire avec discernement, en tenant compte du contexte et des personnes concernées." },
                { title: "Explication orale ou écrite optionnelle", desc: "La tâche d'explication est entièrement optionnelle. Si elle n'est pas nécessaire, il est recommandé de la désactiver." },
              ].map(({ title, desc }, i) => (
                <div key={i} className="bg-secondary/40 rounded-lg p-4">
                  <p className="font-medium text-foreground mb-1">{title}</p>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800">
              Cette application doit être utilisée dans le respect des règles applicables aux données personnelles et aux mineurs dans votre contexte juridique.
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-3">
            <h3 className="font-serif font-semibold">Données et suppression</h3>
            <p className="text-sm text-muted-foreground">Vous pouvez supprimer un apprenant depuis son profil. Toutes les données associées (diagnostics, rapports, observations) seront supprimées.</p>
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/5">Supprimer mon compte</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}