import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { entities, setSessionToken } from "@/api";
import { Plus, UserPlus, Send, Clock, Eye, Sparkles, CheckCircle, Copy, AlertTriangle } from "lucide-react";
import { computeDiagnosticWorkflow, getWorkflowStatusStyle } from "@/lib/workflowEngine";
import { Button } from "@/components/ui/button";
import EmptyState from "../components/EmptyState";
import { toast } from "sonner";

// Human-readable status labels
const SESSION_STATUS = {
  draft: "Session préparée",
  in_progress: "En attente de réponses",
  learner_completed: "Réponses apprenant reçues",
  teacher_review: "Observation à compléter",
  completed: "Prête pour synthèse",
  archived: "Archivée",
};

function humanStatus(d) {
  return SESSION_STATUS[d.status] || d.status;
}

function StatusPill({ status }) {
  const map = {
    draft: "bg-secondary text-muted-foreground border-border",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    learner_completed: "bg-blue-50 text-blue-700 border-blue-200",
    teacher_review: "bg-orange-50 text-orange-700 border-orange-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    archived: "bg-secondary text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${map[status] || map.draft}`}>
      {SESSION_STATUS[status] || status}
    </span>
  );
}

function SectionHeader({ title, desc }) {
  return (
    <div className="mb-4">
      <h2 className="font-serif font-semibold text-lg">{title}</h2>
      {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
    </div>
  );
}

function DiagnosticCard({ d, action, actionLabel, secondaryAction, secondaryLabel, variant = "default" }) {
  const bg = variant === "attention"
    ? "bg-amber-50 border-amber-200"
    : variant === "ready"
    ? "bg-emerald-50 border-emerald-200"
    : "bg-card border-border";

  return (
    <div className={`rounded-xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${bg}`}>
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{d.learner_name || "Apprenant"}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {d.learner_profile_type === "child" ? "Enfant" : d.learner_profile_type === "teen" ? "Adolescent" : "Adulte"}
          {" · "}
          {{ mathematics: "Maths", computer_science: "Info", mixed: "Maths & Info" }[d.domain] || "Maths"}
          {" · "}
          {d.diagnostic_mode === "express" ? "Express" : d.diagnostic_mode === "standard" ? "Standard" : "Complet"}
          {" · "}{new Date(d.created_date).toLocaleDateString("fr-FR")}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {secondaryAction && (
          <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={secondaryAction}>
            {secondaryLabel}
          </Button>
        )}
        {action && (
          <Link to={action}>
            <Button size="sm" variant="outline" className="h-8 text-xs">{actionLabel}</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [diagnostics, setDiagnostics] = useState([]);
  const [links, setLinks] = useState([]);
  const [results, setResults] = useState([]);
  const [completionStatuses, setCompletionStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      entities.Diagnostic.list("-created_date", 50),
      entities.DiagnosticAccessLink.list("-created_date", 100),
      entities.DiagnosticResult.list("-created_date", 50),
      entities.DiagnosticCompletionStatus.list("-created_date", 100),
    ]).then(([d, lk, r, cs]) => {
      setDiagnostics(d);
      setLinks(lk);
      setResults(r);
      setCompletionStatuses(cs);
    }).finally(() => setLoading(false));
  }, []);

  const copyLink = (token) => {
    const url = `${window.location.origin}/session/${token}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => toast.success("Lien copié !")).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  };

  const fallbackCopy = (text) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    toast.success("Lien copié !");
  };

  // Compute workflow for each diagnostic
  const withWorkflow = diagnostics.filter(d => d.status !== "archived").map(d => {
    const dLinks = links.filter(l => l.diagnostic_id === d.id);
    const dResult = results.find(r => r.diagnostic_id === d.id) || null;
    const dCompletion = completionStatuses.find(cs => cs.diagnostic_id === d.id) || null;
    const wf = computeDiagnosticWorkflow(d, dLinks, [], dCompletion, dResult, []);
    return { ...d, _wf: wf, _links: dLinks };
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  // Workflow-based buckets
  const toSend              = withWorkflow.filter(d => ["prepared", "learner_link_ready"].includes(d._wf?.workflow_status));
  const waitingResponses    = withWorkflow.filter(d => d._wf?.workflow_status === "learner_started");
  const responsesReceived   = withWorkflow.filter(d => ["parent_recommended", "teacher_observation_needed", "partial_synthesis_possible"].includes(d._wf?.workflow_status));
  const readyForSynthesis   = withWorkflow.filter(d => d._wf?.workflow_status === "ready_for_synthesis");
  const partialPossible     = withWorkflow.filter(d => d._wf?.workflow_status === "partial_synthesis_possible");
  const toValidate          = withWorkflow.filter(d => d._wf?.workflow_status === "synthesis_generated");
  const reportsReady        = withWorkflow.filter(d => d._wf?.workflow_status === "teacher_validated");

  const getLearnerLink = (diagnosticId) => links.find(l => l.diagnostic_id === diagnosticId && l.respondent_type === "learner");


  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-1">Suivez vos sessions STEM Compass et agissez au bon moment.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/learners?new=1">
            <Button variant="outline" size="sm" className="gap-1.5"><UserPlus className="h-4 w-4" />Ajouter un élève</Button>
          </Link>
          <Link to="/diagnostics/new">
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Nouvelle session</Button>
          </Link>
        </div>
      </div>

      {/* A. Sessions à envoyer */}
      {toSend.length > 0 && (
        <section>
          <SectionHeader
            title={<span className="flex items-center gap-2"><Send className="h-4 w-4 text-accent" />Liens à envoyer ({toSend.length})</span>}
            desc="Ces sessions sont créées mais le lien apprenant n'a pas encore été partagé."
          />
          <div className="space-y-2">
            {toSend.slice(0, 5).map(d => {
              const link = getLearnerLink(d.id);
              return (
                <DiagnosticCard
                  key={d.id}
                  d={d}
                  action={`/diagnostics/${d.id}/overview`}
                  actionLabel="Gérer la session"
                  secondaryAction={link ? () => copyLink(link.token) : null}
                  secondaryLabel={link ? <><Copy className="h-3 w-3" />Copier lien</> : null}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* B. En attente de réponses */}
      {waitingResponses.length > 0 && (
        <section>
          <SectionHeader
            title={<span className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" />En attente de réponses ({waitingResponses.length})</span>}
            desc="L'apprenant a ouvert le lien mais n'a pas encore terminé."
          />
          <div className="space-y-2">
            {waitingResponses.slice(0, 4).map(d => (
              <DiagnosticCard key={d.id} d={d} action={`/diagnostics/${d.id}/overview`} actionLabel="Voir l'état" />
            ))}
          </div>
        </section>
      )}

      {/* C. Réponses reçues — observation à faire */}
      {responsesReceived.length > 0 && (
        <section>
          <SectionHeader
            title={<span className="flex items-center gap-2"><Eye className="h-4 w-4 text-blue-600" />Réponses reçues ({responsesReceived.length})</span>}
            desc="Consultez les réponses ou complétez l'observation professeur."
          />
          <div className="space-y-2">
            {responsesReceived.slice(0, 5).map(d => (
              <DiagnosticCard
                key={d.id}
                d={d}
                action={`/diagnostics/${d.id}/overview`}
                actionLabel="Voir les réponses"
              />
            ))}
          </div>
        </section>
      )}

      {/* D. Synthèse partielle possible */}
      {partialPossible.length > 0 && (
        <section>
          <SectionHeader
            title={<span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-500" />Synthèse partielle disponible ({partialPossible.length})</span>}
            desc="L'apprenant a répondu. Il manque l'observation professeur ou le parent."
          />
          <div className="space-y-2">
            {partialPossible.slice(0, 4).map(d => (
              <DiagnosticCard key={d.id} d={d} variant="attention" action={`/diagnostics/${d.id}/results`} actionLabel="Générer (partielle)" />
            ))}
          </div>
        </section>
      )}

      {/* E. Prêtes pour synthèse complète */}
      {readyForSynthesis.length > 0 && (
        <section>
          <SectionHeader
            title={<span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-600" />Prêtes pour synthèse ({readyForSynthesis.length})</span>}
            desc="Toutes les parties sont prêtes. Générez la synthèse pédagogique."
          />
          <div className="space-y-2">
            {readyForSynthesis.slice(0, 5).map(d => (
              <DiagnosticCard key={d.id} d={d} variant="ready" action={`/diagnostics/${d.id}/results`} actionLabel="Générer la synthèse" />
            ))}
          </div>
        </section>
      )}

      {/* F. Synthèses à valider */}
      {toValidate.length > 0 && (
        <section>
          <SectionHeader
            title={<span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" />Synthèses à valider ({toValidate.length})</span>}
            desc="Synthèse générée mais non encore validée par vous."
          />
          <div className="space-y-2">
            {toValidate.slice(0, 4).map(d => (
              <DiagnosticCard key={d.id} d={d} variant="ready" action={`/diagnostics/${d.id}/results`} actionLabel="Valider la synthèse" />
            ))}
          </div>
        </section>
      )}

      {/* G. Rapports à générer */}
      {reportsReady.length > 0 && (
        <section>
          <SectionHeader
            title={<span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />Rapports à générer ({reportsReady.length})</span>}
            desc="Synthèse validée. Générez les documents pour l'apprenant et le parent."
          />
          <div className="space-y-2">
            {reportsReady.slice(0, 4).map(d => (
              <DiagnosticCard key={d.id} d={d} action={`/diagnostics/${d.id}/results`} actionLabel="Générer les rapports" />
            ))}
          </div>
        </section>
      )}

      {/* État vide */}
      {diagnostics.length === 0 && (
        <EmptyState
          icon={Plus}
          title="Aucune session créée"
          description="Créez une première session pour comprendre comment accompagner un élève en maths ou en informatique."
          action={
            <Link to="/diagnostics/new">
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Créer une session</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}