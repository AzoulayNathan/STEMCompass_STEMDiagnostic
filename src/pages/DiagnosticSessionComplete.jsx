import { useSearchParams, Link } from "react-router-dom";
import { Compass, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const COMPLETE_CONTENT = {
  learner_child: {
    title: "Merci, c'est terminé.",
    text: "Ton professeur va regarder tes réponses pour préparer les bons exercices et choisir la bonne méthode. Tu n'as rien d'autre à faire pour l'instant.",
    cta: null,
  },
  learner_teen: {
    title: "Ta partie est terminée.",
    text: "Tes réponses aideront à construire un plan de travail plus adapté. Le professeur complétera l'analyse et te communiquera les prochaines étapes.",
    cta: null,
  },
  learner_adult: {
    title: "Diagnostic complété.",
    text: "Vos réponses vont permettre d'estimer vos priorités et de préparer un plan de travail. Le professeur pourra valider l'analyse et partager les résultats avec vous.",
    cta: null,
  },
  parent: {
    title: "Merci pour vos réponses.",
    text: "Vos informations aideront le professeur à mieux comprendre le contexte, les devoirs, la confiance et les blocages observés. Vous serez informé des résultats par votre professeur.",
    cta: null,
  },
  teacher: {
    title: "Observation enregistrée.",
    text: "Vos observations pédagogiques ont été sauvegardées. Vous pouvez maintenant générer la synthèse pédagogique.",
    cta: "Voir les résultats",
    ctaLink: null,
  },
};

export default function DiagnosticSessionComplete() {
  const [params] = useSearchParams();
  const role = params.get("role") || "learner";
  const profile = params.get("profile") || "adult";
  const diagnosticId = params.get("diagnostic");

  const key = role === "learner" ? `learner_${profile}` : role;
  const content = COMPLETE_CONTENT[key] || COMPLETE_CONTENT.learner_adult;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 px-6 py-4 max-w-2xl mx-auto">
          <Compass className="h-5 w-5 text-primary" />
          <span className="font-serif font-semibold">STEM Compass</span>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
            <CheckCircle className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="font-serif text-2xl font-bold">{content.title}</h1>
          <p className="text-muted-foreground">{content.text}</p>
          {content.cta && diagnosticId && (
            <Link to={`/diagnostics/${diagnosticId}/results`}>
              <Button size="lg" className="mt-4">{content.cta}</Button>
            </Link>
          )}
          {role === "teacher" && !diagnosticId && (
            <Link to="/dashboard"><Button variant="outline" size="sm">Retour au tableau de bord</Button></Link>
          )}
        </div>
      </div>
    </div>
  );
}