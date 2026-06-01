import { Link } from "react-router-dom";
import { Compass, ArrowRight, Target, MessageSquare, BookOpen, CheckCircle, Eye, Layers, Code, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";

const PROBLEMS = [
  "L'un comprend le cours mais bloque dès que l'exercice change.",
  "L'un applique les formules sans comprendre ce qu'il fait.",
  "L'un panique face à l'erreur et abandonne trop vite.",
  "L'un ne sait pas par où commencer un problème.",
  "L'un lit le code mais ne sait pas l'écrire seul.",
  "L'un comprend l'exemple mais pas l'exercice sans modèle.",
  "L'un a besoin de sens avant la méthode.",
  "L'un a besoin de structure avant de chercher.",
  "L'un bloque sur la rédaction, pas sur le calcul.",
];

const OUTPUTS = [
  { icon: Target, label: "Objectif réel", desc: "Ce que l'élève veut vraiment accomplir : examen, projet, reconversion, compréhension profonde." },
  { icon: Eye, label: "Blocages identifiés", desc: "Compréhension d'énoncé, méthode absente, confiance, erreur récurrente, abstraction fragile." },
  { icon: MessageSquare, label: "Rapport à l'erreur", desc: "Comment l'élève réagit face à l'erreur : analyse, panique, abandon ou changement au hasard." },
  { icon: Layers, label: "Profil de raisonnement", desc: "Comment l'élève raisonne : procédural, analogique, logique, par essai-erreur." },
  { icon: BookOpen, label: "Méthode recommandée", desc: "Ce que le professeur doit privilégier, et ce qu'il doit éviter absolument avec cet élève." },
  { icon: CheckCircle, label: "Première séance conseillée", desc: "Par où commencer concrètement, dès la première heure de cours." },
];

const DOMAINS = [
  { icon: Calculator, label: "Mathématiques", desc: "Calcul, algèbre, fonctions, géométrie, probabilités, raisonnement, rédaction mathématique." },
  { icon: Code, label: "Informatique", desc: "Logique, algorithmique, programmation, debugging, lecture/écriture de code." },
  { icon: Layers, label: "Mixte", desc: "Algorithmique mathématique, data, statistiques avec code, raisonnement abstrait." },
];

const STEPS = [
  { num: "01", title: "Le professeur crée une session.", desc: "Il choisit le domaine, le profil de l'élève, le mode et les parties à compléter." },
  { num: "02", title: "L'élève ou le parent répond.", desc: "Un parcours adapté, envoyé par lien. Pas un examen. Une conversation structurée sur les blocages et la méthode." },
  { num: "03", title: "Le professeur complète son observation.", desc: "Il ajoute son regard professionnel : raisonnement, autonomie, erreurs visibles, réaction face à la difficulté." },
  { num: "04", title: "STEM Compass génère un brief pédagogique.", desc: "Profil de raisonnement, blocages, méthode recommandée, watchlist d'erreurs, plan 4 semaines." },
  { num: "05", title: "Le professeur sait comment commencer.", desc: "Une fiche actionnable. Pas un rapport générique. Une méthode pour cette personne, ce domaine, ce moment." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 md:px-12 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <Compass className="h-5 w-5 text-primary" />
            <span className="font-serif font-semibold text-lg tracking-tight">STEM Compass</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard"><Button variant="ghost" size="sm">Tableau de bord</Button></Link>
            <Link to="/diagnostics/new"><Button size="sm">Créer une session</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 md:px-12 pt-20 pb-24 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card text-xs text-muted-foreground mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Outil de pré-accompagnement pédagogique · Maths &amp; Informatique
        </div>
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
          Comprendre comment un élève<br />
          <span className="text-primary">raisonne avant de l'accompagner.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          STEM Compass aide les professeurs, tuteurs et écoles à comprendre les blocages, méthodes, erreurs et leviers d'apprentissage d'un élève en mathématiques ou en informatique.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/diagnostics/new">
            <Button size="lg" className="gap-2 px-8">
              Créer une session <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="lg" className="px-8">Voir un exemple de brief pédagogique</Button>
          </Link>
        </div>
        <p className="mt-8 text-sm text-muted-foreground font-medium">
          Pas seulement un niveau. Une méthode pour commencer.
        </p>
      </section>

      {/* Domaines */}
      <section className="px-6 md:px-12 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-serif text-xl md:text-2xl font-bold">Deux domaines. Un outil unique.</h2>
          <p className="text-muted-foreground mt-2 text-sm">Maths, informatique ou les deux à la fois.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {DOMAINS.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-6">
              <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-semibold text-sm mb-1">{label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problème */}
      <section className="px-6 md:px-12 py-20 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-2xl md:text-3xl font-bold">
              Deux élèves au même niveau peuvent avoir besoin<br className="hidden md:block" />
              de deux méthodes totalement différentes.
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              STEM Compass identifie ces différences avant la première séance.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="bg-card border border-border rounded-xl px-5 py-4 flex items-start gap-3">
                <span className="text-primary font-bold shrink-0 mt-0.5">—</span>
                <p className="text-sm leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promesse */}
      <section className="px-6 md:px-12 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-serif text-2xl md:text-3xl font-bold">Pas seulement un niveau. Une méthode pour commencer.</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Le brief pédagogique que reçoit le professeur couvre six dimensions essentielles.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {OUTPUTS.map(({ icon: Icon, label, desc }, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6">
              <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-semibold text-sm mb-1">{label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fonctionnement */}
      <section className="px-6 md:px-12 py-20 bg-secondary/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-2xl md:text-3xl font-bold">Comment ça fonctionne</h2>
            <p className="text-muted-foreground mt-2">Cinq étapes. Un brief actionnable.</p>
          </div>
          <div className="space-y-3">
            {STEPS.map(({ num, title, desc }) => (
              <div key={num} className="bg-card border border-border rounded-xl px-6 py-5 flex items-start gap-5">
                <span className="text-xs font-mono font-bold text-primary/40 shrink-0 mt-0.5">{num}</span>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-6 md:px-12 py-24 max-w-3xl mx-auto text-center">
        <h2 className="font-serif text-2xl md:text-3xl font-bold">
          Commencez chaque accompagnement avec une méthode claire.
        </h2>
        <p className="text-muted-foreground mt-3 mb-8 max-w-lg mx-auto">
          Créez une session, envoyez le lien à l'élève ou au parent, recevez un brief pédagogique actionnable en maths ou en informatique.
        </p>
        <Link to="/diagnostics/new">
          <Button size="lg" className="gap-2 px-10">
            Créer une session <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      <footer className="border-t border-border bg-card/50">
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 md:px-12 py-6 max-w-6xl mx-auto gap-3">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">STEM Compass</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Outil de pré-accompagnement pédagogique · Maths &amp; Informatique · Aide à l'enseignement uniquement
          </p>
          <Link to="/settings" className="text-xs text-muted-foreground hover:text-foreground">Confidentialité</Link>
        </div>
      </footer>
    </div>
  );
}