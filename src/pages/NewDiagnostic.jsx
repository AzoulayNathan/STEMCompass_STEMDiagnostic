import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { entities, setSessionToken } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowLeft, Clock, BookOpen, Layers, Users, User, GraduationCap, UserPlus, Calculator, Code } from "lucide-react";
import { getSectionsForDomain, SECTION_META } from "@/lib/questionBank";
import RespondentBadge from "../components/RespondentBadge";

const DOMAINS = [
  {
    value: "mathematics",
    label: "Mathématiques",
    desc: "Calcul, fractions, équations, fonctions, géométrie, probabilités, raisonnement, rédaction.",
    icon: Calculator,
  },
  {
    value: "computer_science",
    label: "Informatique",
    desc: "Logique, algorithmique, programmation, debugging, lecture/écriture de code.",
    icon: Code,
  },
  {
    value: "mixed",
    label: "Maths & Informatique",
    desc: "Algorithmique mathématique, data, logique, raisonnement abstrait, passage problème → code.",
    icon: Layers,
  },
];

const PROFILES = [
  { value: "child", label: "Enfant", desc: "6–11 ans · Tâches guidées, questions simples, mini-tâches adaptées", icon: User },
  { value: "teen", label: "Adolescent", desc: "12–17 ans · Questionnaire autonome + mini-tâches", icon: GraduationCap },
  { value: "adult", label: "Adulte / Étudiant", desc: "18 ans et plus · Diagnostic complet et autonome", icon: Users },
];

const MODES = [
  { value: "express", label: "Express", duration: "8–10 min", desc: "Premier aperçu rapide. Questions essentielles uniquement.", icon: Clock },
  { value: "standard", label: "Standard", duration: "15–20 min", desc: "Diagnostic équilibré. Recommandé par défaut.", icon: BookOpen, recommended: true },
  { value: "complete", label: "Complet", duration: "30–40 min", desc: "Analyse approfondie. Tous les domaines, toutes les dimensions.", icon: Layers },
];

const RESPONDENTS_BY_PROFILE = {
  child: {
    learner: { label: "Élève", desc: "Mini-tâches, ressentis simples, blocages", required: true },
    parent: { label: "Parent", desc: "Contexte familial, observations, objectifs", required: false },
    teacher: { label: "Professeur", desc: "Validation, observations pédagogiques", required: true },
  },
  teen: {
    learner: { label: "Élève", desc: "Questionnaire + mini-tâches (partie principale)", required: true },
    parent: { label: "Parent", desc: "Contexte scolaire, attentes (optionnel)", required: false },
    teacher: { label: "Professeur", desc: "Validation et analyse pédagogique", required: true },
  },
  adult: {
    learner: { label: "Apprenant", desc: "Questionnaire complet + mini-tâches", required: true },
    teacher: { label: "Professeur", desc: "Analyse, priorités, méthode recommandée", required: true },
  },
};

export default function NewDiagnostic() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [learners, setLearners] = useState([]);
  const [learnerId, setLearnerId] = useState("");
  const [domain, setDomain] = useState("mathematics");
  const [profile, setProfile] = useState("adult");
  const [mode, setMode] = useState("standard");
  const [respondents, setRespondents] = useState(["learner", "teacher"]);
  const [modules, setModules] = useState([]);
  const [dialogAgeGroup, setDialogAgeGroup] = useState("adult");
  const [showNewLearner, setShowNewLearner] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("learner")) setLearnerId(params.get("learner"));
    entities.Learner.list("-created_date", 200).then(setLearners);
  }, []);

  useEffect(() => {
    const defaultModules = getSectionsForDomain(domain, profile, mode);
    setModules(defaultModules);
  }, [domain, profile, mode]);

  useEffect(() => {
    if (!respondents.includes("parent")) {
      setModules(prev => prev.filter(k => k !== "parent_context"));
    }
  }, [respondents]);

  const toggleRespondent = (r) => {
    const resp = RESPONDENTS_BY_PROFILE[profile];
    if (resp[r]?.required) return;
    setRespondents(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const toggleModule = (key) => {
    setModules(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleCreateLearner = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const ag = fd.get("age_group");
    const created = await entities.Learner.create({
      first_name: fd.get("first_name"),
      display_name: fd.get("first_name"),
      age: fd.get("age") ? Number(fd.get("age")) : undefined,
      age_group: ag,
      domain: fd.get("domain") || "mathematics",
      learning_context: fd.get("learning_context"),
      primary_goal: fd.get("primary_goal"),
      status: "active",
    });
    setLearners(prev => [created, ...prev]);
    setLearnerId(created.id);
    setProfile(ag || "adult");
    setShowNewLearner(false);
  };

  const makeToken = () => Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

  const handleLaunch = async () => {
    const learner = learners.find(l => l.id === learnerId);
    const diag = await entities.Diagnostic.create({
      learner_id: learnerId,
      learner_name: learner?.display_name || learner?.first_name || "",
      learner_profile_type: profile,
      domain,
      diagnostic_mode: mode,
      selected_modules: modules,
      respondents,
      includes_parent_section: respondents.includes("parent"),
      includes_mini_tasks: modules.some(m => m.includes("mini_tasks")),
      status: "draft",
      workflow_status: "prepared",
      started_at: new Date().toISOString(),
    });

    await entities.DiagnosticCompletionStatus.create({
      diagnostic_id: diag.id,
      learner_section_completed: false,
      parent_section_completed: false,
      teacher_section_completed: false,
      mini_task_completed: false,
      reasoning_task_completed: false,
      explanation_task_completed: false,
      oral_explanation_completed: false,
      missing_sections_json: "[]",
    });

    await entities.DiagnosticAccessLink.create({
      diagnostic_id: diag.id,
      learner_id: learnerId,
      respondent_type: "learner",
      learner_profile_type: profile,
      token: makeToken(),
      status: "active",
    });

    if (respondents.includes("parent") || profile === "child") {
      await entities.DiagnosticAccessLink.create({
        diagnostic_id: diag.id,
        learner_id: learnerId,
        respondent_type: "parent",
        learner_profile_type: profile,
        token: makeToken(),
        status: "active",
      });
    }

    navigate(`/diagnostics/${diag.id}/overview`);
  };

  // Step 0: Apprenant, 1: Domaine, 2: Profil, 3: Mode, 4: Répondants, 5: Modules
  const STEP_TITLES = ["Élève", "Domaine", "Profil", "Mode", "Répondants", "Modules"];
  const canNext = [
    () => !!learnerId,
    () => !!domain,
    () => !!profile,
    () => !!mode,
    () => respondents.length >= 2,
    () => modules.length > 0,
  ];

  const selectedLearner = learners.find(l => l.id === learnerId);
  const allModules = getSectionsForDomain(domain, profile, mode);

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-8">
      <h1 className="font-serif text-2xl font-bold">Nouveau diagnostic</h1>

      {/* Progress */}
      <div className="flex gap-1.5">
        {STEP_TITLES.map((t, i) => (
          <div key={i} className="flex-1">
            <div className={cn("h-1 rounded-full mb-1 transition-colors", i <= step ? "bg-primary" : "bg-border")} />
            <p className={cn("text-xs hidden sm:block", i === step ? "text-primary font-medium" : "text-muted-foreground")}>{t}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-1">Étape {step + 1} / {STEP_TITLES.length}</p>
        <h2 className="font-serif text-xl font-semibold">{STEP_TITLES[step]}</h2>
      </div>

      {/* Step 0 — Élève */}
      {step === 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Sélectionner un élève</Label>
            <button onClick={() => setShowNewLearner(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
              <UserPlus className="h-3.5 w-3.5" />Créer un élève
            </button>
          </div>
          {learners.length === 0 ? (
            <div className="bg-secondary/40 border border-border rounded-lg p-6 text-center text-sm text-muted-foreground">
              Aucun élève. <button onClick={() => setShowNewLearner(true)} className="text-primary hover:underline">Créer le premier élève</button>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {learners.map(l => (
                <button key={l.id} onClick={() => {
                  setLearnerId(l.id);
                  if (l.age_group) setProfile(l.age_group);
                }} className={cn(
                  "w-full text-left px-4 py-3 rounded-lg border transition-colors",
                  learnerId === l.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"
                )}>
                  <p className="font-medium text-sm">{l.display_name || l.first_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {l.age_group === "child" ? "Enfant" : l.age_group === "teen" ? "Adolescent" : "Adulte / Étudiant"}
                    {l.age ? ` · ${l.age} ans` : ""}
                    {l.domain ? ` · ${{ mathematics: "Maths", computer_science: "Info", mixed: "Maths & Info" }[l.domain]}` : ""}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 1 — Domaine */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Choisissez le domaine sur lequel porte ce diagnostic.</p>
          {DOMAINS.map(({ value, label, desc, icon: Icon }) => (
            <button key={value} onClick={() => setDomain(value)} className={cn(
              "w-full text-left px-5 py-4 rounded-lg border flex items-start gap-4 transition-colors",
              domain === value ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"
            )}>
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2 — Profil */}
      {step === 2 && (
        <div className="space-y-3">
          {selectedLearner?.age_group && (
            <p className="text-xs text-muted-foreground">Profil suggéré d'après le profil de l'élève.</p>
          )}
          {PROFILES.map(({ value, label, desc, icon: Icon }) => (
            <button key={value} onClick={() => setProfile(value)} className={cn(
              "w-full text-left px-5 py-4 rounded-lg border flex items-start gap-4 transition-colors",
              profile === value ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"
            )}>
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 3 — Mode */}
      {step === 3 && (
        <div className="space-y-3">
          {MODES.map(({ value, label, duration, desc, icon: Icon, recommended }) => (
            <button key={value} onClick={() => setMode(value)} className={cn(
              "w-full text-left px-5 py-4 rounded-lg border flex items-start gap-4 transition-colors relative",
              mode === value ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"
            )}>
              {recommended && <span className="absolute top-3 right-4 text-xs text-primary font-medium">Recommandé</span>}
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{label}</p>
                  <span className="text-xs text-muted-foreground">{duration}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 4 — Répondants */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Qui répond à quoi ? Les rôles obligatoires sont pré-sélectionnés.</p>
          <div className="space-y-3">
            {Object.entries(RESPONDENTS_BY_PROFILE[profile]).map(([key, info]) => (
              <button key={key} onClick={() => toggleRespondent(key)} disabled={info.required} className={cn(
                "w-full text-left px-5 py-4 rounded-lg border flex items-start gap-4 transition-colors",
                respondents.includes(key) ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40",
                info.required && "cursor-not-allowed opacity-80"
              )}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{info.label}</p>
                    <RespondentBadge type={key} />
                    {info.required && <RespondentBadge type="required" />}
                    {!info.required && <RespondentBadge type="optional" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{info.desc}</p>
                </div>
                <div className={cn("h-5 w-5 rounded border mt-0.5 shrink-0 transition-colors", respondents.includes(key) ? "bg-primary border-primary" : "border-input")} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 5 — Modules */}
      {step === 5 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-3">Sections sélectionnées selon le domaine, le profil et le mode. Vous pouvez les ajuster.</p>
          {allModules.map((key) => {
            const meta = SECTION_META[key];
            if (!meta) return null;
            return (
              <button key={key} onClick={() => toggleModule(key)} className={cn(
                "w-full text-left px-4 py-3.5 rounded-lg border flex items-start gap-4 transition-colors",
                modules.includes(key) ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"
              )}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{meta.title}</p>
                    <RespondentBadge type={meta.respondent} />
                    {meta.required === "optional" && <RespondentBadge type="optional" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.desc} · ~{meta.estimated} min</p>
                </div>
                <div className={cn("h-5 w-5 rounded border mt-0.5 shrink-0", modules.includes(key) ? "bg-primary border-primary" : "border-input")} />
              </button>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="gap-1">
          <ArrowLeft className="h-4 w-4" />Retour
        </Button>
        {step < 5 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canNext[step]()} className="gap-1">
            Suivant<ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleLaunch} disabled={modules.length === 0}>Créer la session</Button>
        )}
      </div>

      {/* New Learner Dialog */}
      <Dialog open={showNewLearner} onOpenChange={setShowNewLearner}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-serif">Nouvel élève</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateLearner} className="space-y-4">
            <div>
              <Label>Prénom / Nom d'usage *</Label>
              <Input name="first_name" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Âge</Label>
                <Input name="age" type="number" min="3" max="99" onChange={e => {
                  const a = Number(e.target.value);
                  if (a >= 3 && a <= 11) setDialogAgeGroup("child");
                  else if (a >= 12 && a <= 17) setDialogAgeGroup("teen");
                  else if (a >= 18) setDialogAgeGroup("adult");
                }} />
              </div>
              <div>
                <Label>Tranche d'âge *</Label>
                <select name="age_group" required value={dialogAgeGroup} onChange={e => setDialogAgeGroup(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="child">Enfant (6–11)</option>
                  <option value="teen">Adolescent (12–17)</option>
                  <option value="adult">Adulte / Étudiant</option>
                </select>
              </div>
              </div>
              <div>
                <Label>Domaine principal</Label>
                <select name="domain" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="mathematics">Mathématiques</option>
                  <option value="computer_science">Informatique</option>
                  <option value="mixed">Maths & Informatique</option>
                </select>
              </div>
              <div>
                <Label>Contexte</Label>
                <select name="learning_context" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">—</option>
                  <option value="school">École / Lycée</option>
                  <option value="private_tutoring">Cours particulier</option>
                  <option value="group_class">Cours collectif</option>
                  <option value="exam_prep">Préparation examen (bac, concours…)</option>
                  <option value="self_study">Auto-apprentissage</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <Label>Objectif principal</Label>
                <Input name="primary_goal" placeholder="ex. passer le bac maths, apprendre Python…" />
              </div>
            <Button type="submit" className="w-full">Créer et sélectionner</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}