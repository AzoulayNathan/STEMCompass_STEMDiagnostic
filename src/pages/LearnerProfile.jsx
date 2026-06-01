import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { entities, setSessionToken } from "@/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, FileText, Activity } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import ReliabilityIndicator from "../components/ReliabilityIndicator";
import EmptyState from "../components/EmptyState";

const AGE_LABELS = { child: "Enfant", teen: "Adolescent", adult: "Adulte" };
const OBS_CATS = [
  { value: "reasoning", label: "Raisonnement" },
  { value: "statement_comprehension", label: "Énoncé" },
  { value: "calculation", label: "Calcul" },
  { value: "method", label: "Méthode" },
  { value: "code", label: "Code" },
  { value: "debugging", label: "Debugging" },
  { value: "explanation", label: "Explication" },
  { value: "confidence", label: "Confiance" },
  { value: "autonomy", label: "Autonomie" },
  { value: "behavior", label: "Comportement" },
  { value: "other", label: "Autre" },
];

function InfoCard({ label, value }) {
  return (
    <div className="bg-card border border-border rounded-lg px-5 py-4">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  );
}

export default function LearnerProfile() {
  const { learnerId } = useParams();
  const [learner, setLearner] = useState(null);
  const [diagnostics, setDiagnostics] = useState([]);
  const [observations, setObservations] = useState([]);
  const [diagnosticResults, setDiagnosticResults] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [obsCat, setObsCat] = useState("oral");
  const [obsNote, setObsNote] = useState("");

  useEffect(() => {
    Promise.all([
      entities.Learner.get(learnerId),
      entities.Diagnostic.filter({ learner_id: learnerId }, "-created_date", 50),
      entities.Observation.filter({ learner_id: learnerId }, "-created_date", 50),
      entities.DiagnosticResult.filter({ learner_id: learnerId }, "-created_date", 20),
      entities.Report.filter({ learner_id: learnerId }, "-created_date", 50),
    ]).then(([l, d, o, dr, r]) => {
      setLearner(l);
      setDiagnostics(d);
      setObservations(o);
      setDiagnosticResults(dr);
      setReports(r);
    }).finally(() => setLoading(false));
  }, [learnerId]);

  const addObservation = async () => {
    if (!obsNote.trim()) return;
    const obs = await entities.Observation.create({ learner_id: learnerId, category: obsCat, note: obsNote });
    setObservations([obs, ...observations]);
    setObsNote("");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!learner) return <div className="p-10 text-center text-muted-foreground">Apprenant introuvable.</div>;

  const latestResult = diagnosticResults[0];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <Link to="/learners" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Apprenants
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">{learner.display_name || learner.first_name}</h1>
          <p className="text-sm text-muted-foreground">
            {AGE_LABELS[learner.age_group]}
            {learner.age ? ` · ${learner.age} ans` : ""}
            {learner.domain ? ` · ${{ mathematics: "Mathématiques", computer_science: "Informatique", mixed: "Maths & Info" }[learner.domain]}` : ""}
          </p>
        </div>
        <Link to={`/diagnostics/new?learner=${learnerId}`}>
          <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Nouveau diagnostic</Button>
        </Link>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="plans">Plans de travail</TabsTrigger>
          <TabsTrigger value="goals">Objectifs</TabsTrigger>
          <TabsTrigger value="observations">Observations</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoCard label="Domaine" value={{ mathematics: "Mathématiques", computer_science: "Informatique", mixed: "Maths & Informatique" }[learner.domain] || "Non renseigné"} />
            <InfoCard label="Contexte" value={{ school: "École / Lycée", private_tutoring: "Cours particulier", group_class: "Cours collectif", exam_prep: "Préparation examen", self_study: "Auto-apprentissage", other: "Autre" }[learner.learning_context] || learner.learning_context || "Non renseigné"} />
            <InfoCard label="Objectif principal" value={learner.primary_goal || "Non renseigné"} />
            <InfoCard label="Statut" value={<StatusBadge status={learner.status || "active"} />} />
          </div>

          {latestResult && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
              <p className="text-xs font-semibold text-primary mb-3">Dernier diagnostic calculé</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <InfoCard label="Profil détecté" value={(latestResult.profile_label || latestResult.main_profile_type || "—").replace(/_/g, " ")} />
                <InfoCard label="Profil pédagogique" value={(latestResult.main_profile_type || "—").replace(/_/g, " ")} />
                <div className="bg-card border border-border rounded-lg px-5 py-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Fiabilité</p>
                  {latestResult.reliability_label ? <ReliabilityIndicator label={latestResult.reliability_label} /> : <span className="text-sm">—</span>}
                </div>
              </div>
            </div>
          )}

          {learner.notes && (
            <div className="bg-card border border-border rounded-lg p-5">
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes pédagogiques</p>
              <p className="text-sm">{learner.notes}</p>
            </div>
          )}

          {!latestResult && (
            <div className="bg-secondary/40 border border-border rounded-lg p-5 text-center">
              <p className="text-sm text-muted-foreground">Aucun résultat calculé. Lancez un diagnostic et calculez les résultats pour voir le profil complet.</p>
              <Link to={`/diagnostics/new?learner=${learnerId}`}><Button size="sm" className="mt-3">Lancer un diagnostic</Button></Link>
            </div>
          )}
        </TabsContent>

        {/* Diagnostics */}
        <TabsContent value="diagnostics" className="mt-6">
          {diagnostics.length === 0 ? (
            <EmptyState icon={FileText} title="Aucun diagnostic" description="Lancez un premier diagnostic pour cet apprenant." action={<Link to={`/diagnostics/new?learner=${learnerId}`}><Button size="sm">Lancer un diagnostic</Button></Link>} />
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-secondary/40">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Mode</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Niveau</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Statut</th>
                  <th className="text-right px-4 py-2.5"></th>
                </tr></thead>
                <tbody>
                  {diagnostics.map(d => {
                    const res = diagnosticResults.find(r => r.diagnostic_id === d.id);
                    return (
                      <tr key={d.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">{new Date(d.created_date).toLocaleDateString("fr-FR")}</td>
                        <td className="px-4 py-3 hidden sm:table-cell capitalize">{d.diagnostic_mode || d.diagnostic_type}</td>
                        <td className="px-4 py-3 hidden md:table-cell">{res?.global_level_estimate || "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-3 text-right">
                          <Link to={d.status === "completed" || d.status === "teacher_review" ? `/diagnostics/${d.id}/results` : `/diagnostics/${d.id}/session`} className="text-primary text-xs hover:underline">Ouvrir</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Plans de travail */}
        <TabsContent value="plans" className="mt-6">
          {diagnosticResults.filter(r => r.four_week_plan_json).length === 0 ? (
            <EmptyState icon={Activity} title="Aucun plan disponible" description="Les plans de travail sont générés après le calcul d'un diagnostic." />
          ) : (
            <div className="space-y-4">
              {diagnosticResults.filter(r => r.four_week_plan_json).slice(0, 3).map(r => {
                let plan = [];
                try { plan = JSON.parse(r.four_week_plan_json); } catch {}
                return (
                  <div key={r.id} className="bg-card border border-border rounded-lg p-5">
                    <p className="font-serif font-semibold text-sm mb-3">{r.global_level_estimate || "Niveau —"} · Plan 4 semaines</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {plan.map((w, i) => (
                        <div key={i} className="bg-secondary/40 rounded-lg p-3">
                          <p className="text-xs font-semibold text-primary mb-0.5">Semaine {w.week} — {w.title}</p>
                          <p className="text-xs text-muted-foreground">{w.objective}</p>
                          {w.activities && <p className="text-xs text-muted-foreground mt-1 italic">{w.activities}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Objectifs */}
        <TabsContent value="goals" className="mt-6 space-y-4">
          <div className="bg-card border border-border rounded-lg p-5">
            <p className="text-xs font-medium text-muted-foreground mb-2">Objectif principal</p>
            <p className="text-sm">{learner.primary_goal || "Non défini"}</p>
          </div>
          <div className="bg-secondary/40 border border-border rounded-lg p-5 text-sm text-muted-foreground">
            Les objectifs secondaires, échéances et contextes détaillés seront configurables dans une prochaine version.
          </div>
        </TabsContent>

        {/* Observations */}
        <TabsContent value="observations" className="mt-6 space-y-4">
          <div className="bg-card border border-border rounded-lg p-5 space-y-3">
            <p className="text-sm font-medium">Ajouter une observation</p>
            <Select value={obsCat} onValueChange={setObsCat}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{OBS_CATS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea value={obsNote} onChange={e => setObsNote(e.target.value)} placeholder="Observation libre…" rows={2} />
            <Button size="sm" onClick={addObservation} disabled={!obsNote.trim()}>Enregistrer l'observation</Button>
          </div>
          {observations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucune observation enregistrée.</p>
          ) : (
            <div className="space-y-2">
              {observations.map(o => (
                <div key={o.id} className="bg-card border border-border rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary capitalize">{o.category}</span>
                    <span className="text-xs text-muted-foreground">{new Date(o.created_date).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <p className="text-sm">{o.note}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rapports */}
        <TabsContent value="reports" className="mt-6">
          {reports.length === 0 ? (
            <EmptyState icon={FileText} title="Aucun rapport disponible" description="Les rapports sont générés depuis la page Résultats d'un diagnostic validé." />
          ) : (
            <div className="space-y-3">
              {reports.map(r => (
                <div key={r.id} className="bg-card border border-border rounded-lg px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{r.report_title || "Rapport"}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.report_type === "teacher" ? "Professeur" : r.report_type === "parent" ? "Parent" : "Apprenant"}
                      {r.generated_at ? ` · ${new Date(r.generated_at).toLocaleDateString("fr-FR")}` : ""}
                    </p>
                  </div>
                  <Link to="/reports"><Button size="sm" variant="outline">Voir</Button></Link>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}