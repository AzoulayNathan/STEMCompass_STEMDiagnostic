import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { entities, setSessionToken } from "@/api";
import { Button } from "@/components/ui/button";
import { Compass, Shield, ArrowRight } from "lucide-react";

// domain-aware content: key = `${respondentType}_${profile}_${domain}` or fallback keys
function getEntryContent(respondentType, profile, domain) {
  if (respondentType === "teacher") {
    return {
      title: "Observation pédagogique.",
      subtitle: "Ajoutez votre regard professionnel : raisonnement observé, autonomie, erreurs visibles, réaction face à l'erreur et priorité d'accompagnement.",
      hints: [
        "Ces observations complètent les réponses de l'élève.",
        "Vous pourrez valider et ajuster la synthèse après cette étape.",
      ],
      cta: "Compléter l'observation",
      privacy: null,
      badge: "Observation professeur",
    };
  }

  if (respondentType === "parent") {
    return {
      title: "Quelques informations pour mieux accompagner l'élève.",
      subtitle: "Vos réponses aident le professeur à comprendre le contexte, les devoirs, les difficultés observées, la confiance et la méthode de travail.",
      hints: [
        "Vous n'avez pas besoin d'évaluer précisément le niveau.",
        "Décrivez ce que vous observez au quotidien.",
        "Ces informations complètent les réponses de l'élève.",
        "Le professeur gardera la décision pédagogique finale.",
      ],
      cta: "Compléter la partie parent",
      privacy: "Évitez les informations sensibles inutiles. Indiquez seulement ce qui peut aider l'accompagnement pédagogique.",
      badge: "Partie parent",
    };
  }

  // Learner — domain-specific
  const domainLabel = domain === "computer_science" ? "en informatique"
    : domain === "mixed" ? "en maths et en informatique"
    : "en maths";

  if (profile === "child") {
    return {
      title: domain === "computer_science"
        ? "Quelques questions pour comprendre comment tu abordes le code."
        : "Quelques questions pour comprendre comment tu réfléchis en maths.",
      subtitle: domain === "computer_science"
        ? "Ce parcours aide ton professeur à comprendre comment tu raisonnes, comment tu cherches et ce qui te bloque en programmation."
        : "Ce n'est pas un contrôle. Tes réponses aideront ton professeur à mieux comprendre où tu bloques et comment t'aider.",
      hints: [
        "Réponds simplement.",
        "Tu peux passer une question si elle ne te concerne pas.",
        "Il n'y a pas de note.",
        "L'objectif est de trouver la bonne manière de t'aider.",
      ],
      cta: "Commencer",
      privacy: "Tes réponses sont utilisées uniquement pour adapter l'accompagnement pédagogique.",
      badge: domain === "computer_science" ? "Parcours informatique" : "Parcours maths",
    };
  }

  if (profile === "teen") {
    return {
      title: domain === "computer_science"
        ? "Quelques questions pour comprendre comment tu abordes le code."
        : "Quelques questions pour comprendre comment tu réfléchis en maths.",
      subtitle: domain === "computer_science"
        ? "Ce parcours aide ton professeur à comprendre comment tu raisonnes, comment tu cherches, comment tu corriges tes erreurs et ce qui te bloque en programmation."
        : "Tes réponses permettront à ton professeur de mieux comprendre ce qui te bloque, où tu en es et quelle méthode peut vraiment t'aider.",
      hints: [
        "Ce n'est pas un examen.",
        domain === "computer_science"
          ? "Tu n'as pas besoin d'être déjà bon en code."
          : "Tu n'as pas besoin d'être fort en maths pour répondre.",
        domain === "computer_science"
          ? "Les erreurs aident à comprendre comment t'accompagner."
          : "Il n'y a pas de bonne ou mauvaise réponse sur ta méthode.",
        "Le but est de trouver la bonne méthode pour progresser.",
      ],
      cta: "Commencer",
      privacy: "Ces réponses sont utilisées pour adapter l'accompagnement pédagogique. Elles ne constituent pas une certification officielle.",
      badge: `Parcours ${domainLabel}`,
    };
  }

  // adult
  return {
    title: domain === "computer_science"
      ? "Comprendre comment vous abordez la programmation."
      : domain === "mixed"
      ? "Préparer un accompagnement adapté en maths et informatique."
      : "Préparer un accompagnement adapté à vos objectifs en maths.",
    subtitle: domain === "computer_science"
      ? "Ce parcours aide à comprendre votre rapport au code, vos blocages, votre méthode de travail et la manière dont vous apprenez le mieux."
      : "Ce parcours aide à comprendre vos objectifs, vos blocages, votre méthode de raisonnement et la façon dont vous apprenez le mieux.",
    hints: [
      "Ce n'est pas un test de niveau officiel.",
      "Vos réponses servent à orienter le plan de travail.",
      "Le professeur pourra compléter et valider l'analyse.",
    ],
    cta: "Commencer",
    privacy: "Ces réponses sont utilisées pour adapter l'accompagnement pédagogique. Elles ne constituent pas une certification officielle.",
    badge: domain === "computer_science" ? "Parcours informatique" : domain === "mixed" ? "Parcours maths & info" : "Parcours maths",
  };
}

export default function SessionEntry() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [link, setLink] = useState(null);
  const [diagnostic, setDiagnostic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    setSessionToken(token);
    entities.DiagnosticAccessLink.filter({ token }).then(async results => {
      if (!results?.length) { setError("Lien introuvable ou expiré."); setLoading(false); return; }
      const l = results[0];
      if (l.status === "expired" || l.status === "revoked") { setError("Ce lien n'est plus actif."); setLoading(false); return; }
      setLink(l);
      const d = await entities.Diagnostic.get(l.diagnostic_id);
      setDiagnostic(d);
      if (!l.opened_at) {
        await entities.DiagnosticAccessLink.update(l.id, { opened_at: new Date().toISOString() });
      }
      setLoading(false);
    }).catch(() => { setError("Impossible de charger cette session."); setLoading(false); });
  }, [token]);

  const handleStart = async () => {
    setStarting(true);
    navigate(`/diagnostics/${link.diagnostic_id}/session?role=${link.respondent_type}&profile=${link.learner_profile_type}&token=${token}&domain=${diagnostic?.domain || "mathematics"}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <Compass className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-serif font-bold text-xl mb-2">Lien non disponible</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    </div>
  );

  const domain = diagnostic?.domain || "mathematics";
  const content = getEntryContent(link.respondent_type, link.learner_profile_type, domain);
  const learnerName = diagnostic?.learner_name;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 px-6 py-4 max-w-2xl mx-auto">
          <Compass className="h-5 w-5 text-primary" />
          <span className="font-serif font-semibold">STEM Compass</span>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/8 text-primary border border-primary/20">
              {content.badge}
            </span>
            {link.status === "completed" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Complétée
              </span>
            )}
          </div>

          {learnerName && (
            <p className="text-sm text-muted-foreground">Session pour : <strong>{learnerName}</strong></p>
          )}

          <h1 className="font-serif text-2xl md:text-3xl font-bold leading-snug">{content.title}</h1>
          <p className="text-muted-foreground">{content.subtitle}</p>

          <ul className="space-y-2">
            {content.hints.map((hint, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary font-bold mt-0.5 shrink-0">·</span>{hint}
              </li>
            ))}
          </ul>

          {content.privacy && (
            <div className="flex items-start gap-2 bg-secondary/50 border border-border rounded-lg p-4">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{content.privacy}</p>
            </div>
          )}

          {link.status === "completed" ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-700">
              Cette partie a déjà été complétée. Merci pour vos réponses.
            </div>
          ) : (
            <Button onClick={handleStart} disabled={starting} size="lg" className="w-full gap-2">
              {starting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {content.cta} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}