import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { entities, setSessionToken } from "@/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, CheckCircle, AlertCircle, Clock, ExternalLink, Sparkles, Info, Play, MessageCircle, Mail } from "lucide-react";
import { toast } from "sonner";

const SESSION_STATUSES = {
  draft: { label: "Session préparée", cls: "bg-secondary text-muted-foreground border-border" },
  in_progress: { label: "En attente de réponses", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  learner_completed: { label: "Réponses apprenant reçues", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  teacher_review: { label: "Observation à compléter", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  completed: { label: "Prête pour synthèse", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  archived: { label: "Archivée", cls: "bg-secondary text-muted-foreground border-border" },
};

const PROFILE_LABELS = { child: "Enfant", teen: "Adolescent", adult: "Adulte" };
const MODE_LABELS = { express: "Express", standard: "Standard", complete: "Complet" };

function generateToken() {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

function PartRow({ label, respondent, link, importance, impact, onCopy, onGenerate, onOpen, onWhatsApp, onMail, onDirect }) {
  const sc = !link
    ? { icon: AlertCircle, cls: "text-muted-foreground", label: "Lien non généré" }
    : link.status === "completed"
    ? { icon: CheckCircle, cls: "text-emerald-600", label: "Complétée" }
    : { icon: Clock, cls: "text-amber-600", label: "En attente" };

  const Icon = sc.icon;

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-4">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{importance}</p>
      </td>
      <td className="px-4 py-4 text-sm text-muted-foreground hidden sm:table-cell">{respondent}</td>
      <td className="px-4 py-4">
        <span className={`flex items-center gap-1.5 text-sm ${sc.cls}`}>
          <Icon className="h-3.5 w-3.5" />{sc.label}
        </span>
      </td>
      <td className="px-4 py-4 text-xs text-muted-foreground hidden lg:table-cell max-w-[180px]">{impact}</td>
      <td className="px-4 py-4">
        <div className="flex gap-1.5 flex-wrap">
          {link ? (
            <>
              <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs" onClick={() => onCopy(link.token)}>
                <Copy className="h-3 w-3" />Copier
              </Button>
              {onWhatsApp && (
                <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs text-green-700" onClick={() => onWhatsApp(link.token)}>
                  <MessageCircle className="h-3 w-3" />WhatsApp
                </Button>
              )}
              {onMail && (
                <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs" onClick={() => onMail(link.token)}>
                  <Mail className="h-3 w-3" />Mail
                </Button>
              )}
            </>
          ) : (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onGenerate}>
              Générer le lien
            </Button>
          )}
          {onDirect && (
            <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs text-primary" onClick={onDirect}>
              <Play className="h-3 w-3" />Démarrer ici
            </Button>
          )}
          {onOpen && (
            <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs" onClick={onOpen}>
              <ExternalLink className="h-3 w-3" />Ouvrir
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function ResponseHighlight({ label, value }) {
  if (!value) return null;
  return (
    <div className="bg-secondary/50 rounded-lg px-4 py-3">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm leading-relaxed">{value}</p>
    </div>
  );
}

export default function TeacherDiagnosticOverview() {
  const { diagnosticId } = useParams();
  const [diagnostic, setDiagnostic] = useState(null);
  const [learner, setLearner] = useState(null);
  const [links, setLinks] = useState([]);
  const [result, setResult] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      entities.Diagnostic.get(diagnosticId),
      entities.DiagnosticAccessLink.filter({ diagnostic_id: diagnosticId }),
      entities.DiagnosticResult.filter({ diagnostic_id: diagnosticId }),
      entities.DiagnosticResponse.filter({ diagnostic_id: diagnosticId }),
    ]).then(async ([d, l, r, resp]) => {
      setDiagnostic(d);
      setLinks(l);
      setResult(r?.[0] || null);
      setResponses(resp || []);
      if (d?.learner_id && d.learner_id !== "placeholder") {
        const ln = await entities.Learner.get(d.learner_id);
        setLearner(ln);
      }
    }).finally(() => setLoading(false));
  }, [diagnosticId]);

  const getLink = (type) => links.find(l => l.respondent_type === type);

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

  const generateLink = async (respondentType) => {
    const token = generateToken();
    const newLink = await entities.DiagnosticAccessLink.create({
      diagnostic_id: diagnosticId,
      learner_id: diagnostic?.learner_id,
      respondent_type: respondentType,
      learner_profile_type: diagnostic?.learner_profile_type || "adult",
      token,
      status: "active",
    });
    setLinks(prev => [...prev, newLink]);
    const url = `${window.location.origin}/session/${token}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => toast.success("Lien généré et copié !")).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/session/${token}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => toast.success("Lien copié !")).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  };

  const shareWhatsApp = (token) => {
    const url = `${window.location.origin}/session/${token}`;
    window.open(`https://wa.me/?text=${encodeURIComponent("Bonjour, voici le lien pour compléter votre partie du parcours STEM Compass : " + url)}`, "_blank");
  };

  const shareMail = (token, role) => {
    const url = `${window.location.origin}/session/${token}`;
    const labels = { learner: "apprenant", parent: "parent", teacher: "professeur" };
    const subject = encodeURIComponent("Votre lien STEM Compass");
    const body = encodeURIComponent(`Bonjour,\n\nVoici le lien pour compléter votre partie du parcours STEM Compass :\n${url}\n\nCe parcours aide à mieux comprendre les besoins de l'élève en mathématiques, informatique ou raisonnement scientifique.\n\nMerci.`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const startDirectSession = (role) => {
    window.open(`/diagnostics/${diagnosticId}/session?role=${role}`, "_blank");
  };

  const openTeacherSession = () => {
    const tl = getLink("teacher");
    if (tl) {
      window.open(`/session/${tl.token}`, "_blank");
    } else {
      window.location.href = `/diagnostics/${diagnosticId}/session?role=teacher`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!diagnostic) {
    return <div className="p-10 text-center text-muted-foreground">Session introuvable.</div>;
  }

  const learnerLink = getLink("learner");
  const parentLink = getLink("parent");
  const teacherLink = getLink("teacher");
  const statusCfg = SESSION_STATUSES[diagnostic.status] || SESSION_STATUSES.draft;
  const showParent = diagnostic.includes_parent_section || diagnostic.learner_profile_type === "child";

  // Extract key responses using real question bank keys
  const getResponse = (key) =>
    responses.find(r => r.question_key === key)?.response_value ||
    responses.find(r => r.question_key === key)?.response_text || null;
  const getFirstOf = (...keys) => keys.map(k => getResponse(k)).find(Boolean) || null;

  const goalResponse    = result?.learner_personal_goal_text || getFirstOf("goal_01", "goal_02", "goal_03");
  const successResponse = result?.success_indicator_text || getResponse("goal_04");
  const blockResponse   = result?.main_blockage_text || getFirstOf("block_01", "block_02", "block_03");
  const oralResponse    = getFirstOf("oral_01", "oral_02");
  const errorResponse   = getFirstOf("err_01", "err_02");
  const motivResponse   = result?.engagement_levers_json
    ? (() => {
        try {
          const arr = JSON.parse(result.engagement_levers_json);
          return Array.isArray(arr)
            ? arr.filter(x => x !== "À préciser lors de la première séance").join(", ") || null
            : null;
        } catch { return null; }
      })()
    : getFirstOf("motiv_01", "motiv_02", "motiv_04");
  const parentResponse = getFirstOf("par_01", "par_02", "par_03");
  const teacherNote    = getFirstOf("obs_01", "obs_02", "obs_07");

  const hasEnoughData = learnerLink?.status === "completed";
  const hasTeacherObservation = teacherLink?.status === "completed";
  const canGenerateSynthesis = hasEnoughData;
  const hasAnyResponse = goalResponse || blockResponse || motivResponse || oralResponse;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-7">
      {/* Back */}
      <Link to={`/learners/${diagnostic.learner_id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Retour au profil
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Vue professeur</p>
          <h1 className="font-serif text-2xl font-bold">{diagnostic.learner_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {PROFILE_LABELS[diagnostic.learner_profile_type] || "Adulte"}
            {learner?.age ? ` · ${learner.age} ans` : ""}
            {learner?.domain ? ` · ${({ mathematics: "Mathématiques", computer_science: "Informatique", mixed: "Maths & Info" })[learner.domain] || learner.domain}` : ""}
            {learner?.school_level ? ` · ${learner.school_level}` : ""}
          </p>
          {learner?.primary_goal && (
            <p className="text-xs text-muted-foreground mt-0.5 italic">Objectif déclaré : {learner.primary_goal}</p>
          )}
        </div>
        <div>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border ${statusCfg.cls}`}>
            {statusCfg.label}
          </span>
          <p className="text-xs text-muted-foreground mt-1.5 text-right">
            {MODE_LABELS[diagnostic.diagnostic_mode] || diagnostic.diagnostic_mode}
            {" · "}{new Date(diagnostic.created_date).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>

      {/* État des parties */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-serif font-semibold">État des parties</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Gérez les liens et suivez la complétion de chaque partie.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Partie</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Destinataire</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Statut</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Impact si absent</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              <PartRow
                label="Parcours apprenant"
                respondent="Apprenant"
                link={learnerLink}
                importance="Essentiel"
                impact="Sans cette partie, la synthèse reste très partielle."
                onCopy={copyLink}
                onGenerate={() => generateLink("learner")}
                onWhatsApp={shareWhatsApp}
                onMail={(token) => shareMail(token, "learner")}
                onDirect={() => startDirectSession("learner")}
              />
              {showParent && (
                <PartRow
                  label="Partie parent"
                  respondent="Parent / tuteur"
                  link={parentLink}
                  importance="Recommandé"
                  impact="Apporte le contexte que l'enfant ne peut pas toujours exprimer."
                  onCopy={copyLink}
                  onGenerate={() => generateLink("parent")}
                  onWhatsApp={shareWhatsApp}
                  onMail={(token) => shareMail(token, "parent")}
                />
              )}
              <PartRow
                label="Observation professeur"
                respondent="Vous"
                link={teacherLink}
                importance="Recommandé"
                impact="Améliore la fiabilité et la précision des recommandations."
                onCopy={copyLink}
                onGenerate={() => generateLink("teacher")}
                onOpen={openTeacherSession}
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Résumé des réponses reçues */}
      {hasEnoughData && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-serif font-semibold">Ce que l'apprenant a exprimé</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Aperçu des réponses avant synthèse complète.</p>
          </div>
          <div className="p-5">
            {hasAnyResponse ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <ResponseHighlight label="Objectif déclaré" value={goalResponse} />
                <ResponseHighlight label="Situation de réussite" value={successResponse} />
                <ResponseHighlight label="Blocage principal" value={blockResponse} />
                <ResponseHighlight label="Rapport à l'oral" value={oralResponse} />
                <ResponseHighlight label="Face à l'erreur" value={errorResponse} />
                <ResponseHighlight label="Thèmes motivants" value={motivResponse} />
                {parentResponse && <ResponseHighlight label="Parent observe que…" value={parentResponse} />}
                {teacherNote && <ResponseHighlight label="Professeur note que…" value={teacherNote} />}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Les réponses détaillées apparaîtront ici après traitement.</p>
            )}
          </div>
        </div>
      )}

      {/* Avertissements */}
      {!learnerLink && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Lien apprenant non généré</p>
            <p className="text-xs text-amber-700 mt-0.5">Générez et partagez le lien apprenant pour obtenir ses réponses. Sans cette partie, la synthèse sera incomplète.</p>
          </div>
        </div>
      )}

      {canGenerateSynthesis && !hasTeacherObservation && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Synthèse partielle possible</p>
            <p className="text-xs text-blue-700 mt-0.5">Vous pouvez générer une synthèse maintenant, mais certaines recommandations seront à confirmer après votre observation.</p>
          </div>
        </div>
      )}

      {/* Actions principales */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button variant="outline" className="gap-1.5" onClick={openTeacherSession}>
          <ExternalLink className="h-4 w-4" />Compléter l'observation
        </Button>
        <Link to={`/diagnostics/${diagnosticId}/results`}>
          <Button className="gap-1.5" disabled={!canGenerateSynthesis}>
            <Sparkles className="h-4 w-4" />
            {canGenerateSynthesis ? "Générer la synthèse pédagogique" : "En attente de réponses"}
          </Button>
        </Link>
      </div>
    </div>
  );
}