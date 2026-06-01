import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { entities, setSessionToken } from "@/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, FileText, CheckCircle, AlertCircle, RefreshCw,
  BookOpen, Target, Sparkles, AlertTriangle, Eye, Printer, ChevronDown, ChevronRight
} from "lucide-react";
import ReliabilityIndicator from "../components/ReliabilityIndicator";
import PriorityCard from "../components/PriorityCard";
import { calculateDiagnosticResult } from "@/lib/stemScoringEngine";
import { generateTeacherReport, generateParentReport, generateLearnerReport } from "@/lib/stemReportGenerator";

const DOMAIN_LABELS = { mathematics: "Mathématiques", computer_science: "Informatique", mixed: "Maths & Informatique" };

function SectionTitle({ children, sub }) {
  return (
    <div className="mb-4">
      <h2 className="font-serif font-semibold text-lg">{children}</h2>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  if (!value) return null;
  return (
    <div className="border-b border-border last:border-0 py-3 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
      <span className="text-xs font-medium text-muted-foreground shrink-0 sm:w-44">{label}</span>
      <span className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function Pill({ children, cls = "bg-secondary text-muted-foreground border-border" }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {children}
    </span>
  );
}

function Collapsible({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/20 transition-colors"
      >
        <span className="font-serif font-semibold text-base">{title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

export default function DiagnosticResults() {
  const { diagnosticId } = useParams();
  const navigate = useNavigate();

  const [diagnostic, setDiagnostic] = useState(null);
  const [learner, setLearner] = useState(null);
  const [responses, setResponses] = useState([]);
  const [result, setResult] = useState(null);
  const [savedResult, setSavedResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [generatingReport, setGeneratingReport] = useState(null);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    entities.Diagnostic.get(diagnosticId).then(async d => {
      setDiagnostic(d);
      const [rs, lr, existing] = await Promise.all([
        entities.DiagnosticResponse.filter({ diagnostic_id: diagnosticId }),
        (d.learner_id && d.learner_id !== 'placeholder') ? entities.Learner.get(d.learner_id) : null,
        entities.DiagnosticResult.filter({ diagnostic_id: diagnosticId }),
      ]);
      setResponses(rs);
      setLearner(lr);
      if (existing?.[0]) {
        const r = existing[0];
        setSavedResult(r);
        setResult(parseStoredResult(r));
      }
      setLoading(false);
    });
  }, [diagnosticId]);

  function tryParse(str, fallback) {
    try { return JSON.parse(str); } catch { return fallback; }
  }

  const parseStoredResult = (r) => ({
    ...r,
    secondary_profile_tags: tryParse(r.secondary_profile_tags_json, []),
    priority_areas: tryParse(r.priority_areas_json, []),
    avoid_list: tryParse(r.avoid_list_json, []),
    recommended_activities: tryParse(r.recommended_activities_json, []),
    four_week_plan: tryParse(r.four_week_plan_json, []),
    error_watchlist: tryParse(r.error_watchlist_json, []),
    engagement_levers: tryParse(r.engagement_levers_json, []),
    preferred_themes: tryParse(r.preferred_themes_json, []),
  });

  const runScoring = useCallback(async () => {
    setCalculating(true);
    const calc = calculateDiagnosticResult(responses, diagnostic, learner);
    setResult(calc);

    const data = {
      diagnostic_id: diagnosticId,
      learner_id: diagnostic?.learner_id,
      global_level_estimate: calc.global_level_estimate,
      oral_comprehension_level: calc.oral_comprehension_level,
      written_comprehension_level: calc.written_comprehension_level,
      oral_interaction_level: calc.oral_interaction_level,
      written_production_level: calc.written_production_level,
      vocabulary_level: calc.vocabulary_level,
      grammar_in_context_level: calc.grammar_in_context_level,
      instruction_comprehension_level: calc.instruction_comprehension_level,
      oral_confidence_score: calc.oral_confidence_score,
      autonomy_score: calc.autonomy_score,
      learner_strategy_score: calc.learner_strategy_score,
      exposure_score: calc.exposure_score,
      emotional_block_score: calc.emotional_block_score,
      need_for_structure_score: calc.need_for_structure_score,
      correction_tolerance_score: calc.correction_tolerance_score,
      main_profile_type: calc.main_profile_type,
      secondary_profile_tags_json: JSON.stringify(calc.secondary_profile_tags || []),
      priority_areas_json: JSON.stringify(calc.priority_areas || []),
      recommended_method_text: calc.recommended_method_text,
      avoid_list_json: JSON.stringify(calc.avoid_list || []),
      recommended_activities_json: JSON.stringify(calc.recommended_activities || []),
      four_week_plan_json: JSON.stringify(calc.four_week_plan || []),
      error_watchlist_json: JSON.stringify(calc.error_watchlist || []),
      engagement_levers_json: JSON.stringify(calc.engagement_levers || []),
      preferred_themes_json: JSON.stringify(calc.preferred_themes || []),
      next_session_focus_text: calc.next_session_focus_text,
      reliability_score: calc.reliability_score,
      reliability_label: calc.reliability_label,
      motivation_profile: calc.motivation_profile,
      goal_clarity_score: calc.goal_clarity_score,
      success_indicator_text: calc.success_indicator_text,
      first_lesson_angle_text: calc.first_lesson_angle_text,
      parent_support_notes: calc.parent_support_notes,
      learner_personal_goal_text: calc.learner_personal_goal_text,
    };

    let saved;
    if (savedResult) {
      saved = await entities.DiagnosticResult.update(savedResult.id, data);
    } else {
      saved = await entities.DiagnosticResult.create(data);
    }
    setSavedResult(saved);
    await entities.Diagnostic.update(diagnosticId, {
      reliability_label: calc.reliability_label,
      status: "completed",
      workflow_status: "synthesis_generated",
      diagnostic_mode: diagnostic.diagnostic_mode,
      learner_profile_type: diagnostic.learner_profile_type,
    });
    setDiagnostic(prev => ({ ...prev, reliability_label: calc.reliability_label, status: "completed" }));
    setCalculating(false);
  }, [responses, diagnostic, learner, savedResult, diagnosticId]);

  const handleValidate = async () => {
    await entities.Diagnostic.update(diagnosticId, { status: "completed", teacher_validated: true, workflow_status: "teacher_validated" });
    if (savedResult) await entities.DiagnosticResult.update(savedResult.id, { teacher_validated: true, teacher_adjustment_notes: adjustmentNote });
    setDiagnostic(prev => ({ ...prev, status: "completed", teacher_validated: true }));
    if (savedResult) setSavedResult(prev => ({ ...prev, teacher_validated: true }));
  };

  const generateAndSaveReport = async (type) => {
    if (!result) return;
    setGeneratingReport(type);
    let report;
    if (type === "teacher") report = generateTeacherReport(result, diagnostic, learner);
    else if (type === "parent") report = generateParentReport(result, diagnostic, learner);
    else report = generateLearnerReport(result, diagnostic, learner);

    const existing = await entities.Report.filter({ diagnostic_id: diagnosticId, report_type: type });
    const data = {
      diagnostic_id: diagnosticId,
      learner_id: diagnostic?.learner_id,
      report_type: type,
      report_title: report.title,
      report_content_json: JSON.stringify(report.sections),
      report_content_text: report.text,
      generated_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString(),
      export_status: "ready",
    };
    if (existing?.[0]) {
      await entities.Report.update(existing[0].id, data);
    } else {
      await entities.Report.create(data);
    }
    setGeneratingReport(null);
    await entities.Diagnostic.update(diagnosticId, { workflow_status: "reports_generated" });
    navigate("/reports");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!diagnostic) return <div className="p-10 text-center text-muted-foreground">Diagnostic introuvable.</div>;

  const profile = diagnostic.learner_profile_type || "adult";
  const profileLabel = { child: "Enfant", teen: "Adolescent", adult: "Adulte" }[profile] || "Adulte";
  const reliabilityLabel = result?.reliability_label || diagnostic.reliability_label || "a_confirmer";
  const name = learner?.display_name || learner?.first_name || diagnostic.learner_name || "L'apprenant";

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6 print:p-4 print:space-y-4">
      {/* Nav */}
      <div className="flex items-center justify-between print:hidden">
        <Link to={`/learners/${diagnostic.learner_id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Retour au profil
        </Link>
        <div className="flex gap-2">
          {result && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" />Imprimer
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={runScoring} disabled={calculating} className="gap-1.5">
            {calculating ? <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {result ? "Recalculer" : "Générer la synthèse"}
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            {name} · {profileLabel} · {DOMAIN_LABELS[diagnostic.domain] || "Mathématiques"} · {diagnostic.diagnostic_mode}
          </p>
          <h1 className="font-serif text-2xl font-bold mt-1">Brief pédagogique</h1>
          <p className="text-xs text-muted-foreground mt-1">{new Date(diagnostic.created_date).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-start shrink-0">
          <ReliabilityIndicator label={reliabilityLabel} />
          {diagnostic.teacher_validated && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium">
              <CheckCircle className="h-4 w-4" />Validé
            </span>
          )}
        </div>
      </div>

      {/* Banner génération */}
      {!result && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <p className="font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Générer la synthèse pédagogique</p>
            <p className="text-xs text-muted-foreground mt-1">{responses.length} réponse(s) disponible(s). La synthèse sera calculée à partir de toutes les données recueillies.</p>
          </div>
          <Button onClick={runScoring} disabled={calculating} className="gap-1.5 shrink-0">
            {calculating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyse…</> : <><Sparkles className="h-4 w-4" />Générer</>}
          </Button>
        </div>
      )}

      {result && (
        <>
          {/* ━━━ 1. BRIEF PROFESSEUR ━━━ */}
          <div className="bg-primary/5 border border-primary/25 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-serif font-bold text-xl flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />Brief pédagogique
              </h2>
              <Pill cls="bg-primary/10 text-primary border-primary/20">{result.profile_label || "Profil"}</Pill>
            </div>

            {result.global_profile_summary && (
              <p className="text-sm leading-relaxed border-l-2 border-primary/30 pl-4 text-foreground/90">
                {result.global_profile_summary}
              </p>
            )}

            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              {result.learner_personal_goal_text && (
                <div className="bg-card rounded-lg border border-border px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Objectif réel</p>
                  <p className="text-sm">{result.learner_personal_goal_text}</p>
                </div>
              )}
              {result.main_blockage_text && (
                <div className="bg-card rounded-lg border border-border px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Blocage principal</p>
                  <p className="text-sm">{result.main_blockage_text}</p>
                </div>
              )}
              {result.first_lesson_angle_text && (
                <div className="bg-card rounded-lg border border-border px-4 py-3 sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Comment commencer</p>
                  <p className="text-sm">{result.first_lesson_angle_text}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(result.secondary_profile_tags || []).map((tag, i) => (
                <Pill key={i}>{tag}</Pill>
              ))}
            </div>
          </div>

          {/* ━━━ 2. PREMIÈRE SÉANCE ━━━ */}
          <Collapsible title="Première séance conseillée" defaultOpen>
            <div className="space-y-3 mt-1">
              <InfoRow label="Angle d'entrée" value={result.first_lesson_angle_text} />
              <InfoRow label="Activité recommandée" value={result.recommended_first_activity} />
              <InfoRow label="Posture pédagogique" value={result.teacher_posture} />
              <InfoRow label="Stratégie de correction" value={result.correction_strategy} />
              {result.success_indicator_text && (
                <InfoRow label="Réussite personnelle" value={result.success_indicator_text} />
              )}
              <InfoRow label="Focus de départ" value={result.next_session_focus_text} />
            </div>
          </Collapsible>

          {/* ━━━ 3. MÉTHODE RECOMMANDÉE ━━━ */}
          <Collapsible title="Méthode recommandée" defaultOpen>
            {result.recommended_method_text && (
              <p className="text-sm leading-relaxed mb-4">{result.recommended_method_text}</p>
            )}
            {result.recommended_activities?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Activités à privilégier</p>
                <ul className="space-y-1.5">
                  {result.recommended_activities.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm"><span className="text-primary font-bold mt-0.5 shrink-0">·</span>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.avoid_list?.length > 0 && (
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-xs font-medium text-accent mb-2 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" />Ce qu'il faut éviter</p>
                <ul className="space-y-1.5">
                  {result.avoid_list.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="shrink-0 mt-0.5">—</span>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </Collapsible>

          {/* ━━━ 4. LEVIERS DE MOTIVATION ━━━ */}
          {((result.engagement_levers?.length > 0 && result.engagement_levers[0] !== "À préciser lors de la première séance") || result.preferred_themes?.length > 0) && (
            <Collapsible title="Leviers de motivation et thèmes">
              <div className="space-y-4 mt-1">
                {result.preferred_themes?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Sujets à utiliser dans les exercices</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.preferred_themes.map((t, i) => <Pill key={i}>{t}</Pill>)}
                    </div>
                  </div>
                )}
                {result.success_indicator_text && (
                  <InfoRow label="Situation de réussite" value={result.success_indicator_text} />
                )}
                {result.parent_support_notes && (
                  <InfoRow label="Observation parent" value={result.parent_support_notes} />
                )}
              </div>
            </Collapsible>
          )}

          {/* ━━━ 5. COMPÉTENCES ESTIMÉES ━━━ */}
          <Collapsible title="Compétences estimées">
            <p className="text-xs text-muted-foreground mb-4 italic">
              {result.skill_estimate_note || "Basé sur les mini-tâches et l'observation professeur."}
            </p>
            {result.skill_estimate_available && result.skill_estimate_dimensions?.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {result.skill_estimate_dimensions.map((d, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-lg border bg-secondary/30 border-border">
                    <span className="text-sm text-muted-foreground">{d.label}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      d.value === "solide" || d.value === "présente" || d.value === "bien orienté" || d.value === "ancré" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      d.value === "fragile" || d.value === "minimale" || d.value === "à consolider" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-secondary text-muted-foreground border-border"
                    }`}>{d.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                Mini-tâches non complétées — le niveau de compétence est à confirmer lors de la première séance.
              </div>
            )}
          </Collapsible>

          {/* ━━━ 6. PRIORITÉS ━━━ */}
          {result.priority_areas?.length > 0 && (
            <Collapsible title={`Priorités pédagogiques (${result.priority_areas.length})`} defaultOpen>
              <div className="space-y-3 mt-1">
                {result.priority_areas.map((p, i) => <PriorityCard key={i} priority={p} index={i} />)}
              </div>
            </Collapsible>
          )}

          {/* ━━━ 7. PLAN 4 SEMAINES ━━━ */}
          {result.four_week_plan?.length > 0 && (
            <Collapsible title="Plan de travail — 4 semaines">
              <div className="space-y-4 mt-1">
                {result.four_week_plan.map((week, i) => (
                  <div key={i} className="bg-secondary/30 rounded-lg p-4">
                    <h3 className="font-semibold text-sm mb-3">
                      <span className="text-primary">Semaine {week.week}</span> — {week.title}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-2.5 text-sm">
                      {[
                        { label: "Objectif", value: week.objective },
                        { label: "Activités", value: week.activities },
                        { label: "À surveiller", value: week.monitor },
                        { label: "Mini-évaluation", value: week.mini_eval },
                        { label: "Progrès attendu", value: week.expected_progress },
                      ].filter(d => d.value).map(({ label, value }, j) => (
                        <div key={j}>
                          <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
                          <p className="text-sm">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Collapsible>
          )}

          {/* ━━━ 8. WATCHLIST ERREURS ━━━ */}
          {result.error_watchlist?.length > 0 && (
            <Collapsible title="Erreurs et comportements à surveiller">
              <p className="text-xs text-muted-foreground mb-4">Ces éléments sont à noter au fil des séances pour affiner la méthode.</p>
              <div className="space-y-3 mt-1">
                {result.error_watchlist.map((item, i) => (
                  <div key={i} className="border border-border rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <Pill>{item.type}</Pill>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.why}</p>
                    {item.how_to_note && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Comment noter :</span> {item.how_to_note}</p>}
                  </div>
                ))}
              </div>
            </Collapsible>
          )}

          {/* ━━━ 9. FIABILITÉ ━━━ */}
          <Collapsible title="Fiabilité et éléments à confirmer">
            <div className="space-y-3 mt-1">
              <ReliabilityIndicator label={reliabilityLabel} />
              {result.missing_evidence?.length > 0 && (
                <div className="space-y-2 mt-3">
                  {result.missing_evidence.map((m, i) => (
                    <div key={i} className="flex gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              )}
              {(!result.missing_evidence || result.missing_evidence.length === 0) && (
                <p className="text-sm text-muted-foreground mt-2">Les données recueillies sont suffisantes pour générer une synthèse fiable.</p>
              )}
            </div>
          </Collapsible>

          {/* ━━━ 10. VALIDATION ━━━ */}
          <Collapsible title="Validation professeur">
            <div className="space-y-4 mt-1">
              <p className="text-sm text-muted-foreground">Validez la synthèse pour la finaliser. Vous pouvez ajouter une note d'ajustement.</p>
              <div>
                <Label>Note d'ajustement (optionnel)</Label>
                <Textarea
                  value={adjustmentNote}
                  onChange={e => setAdjustmentNote(e.target.value)}
                  placeholder="Ex. : L'oral n'a pas pu être complété. Je confirme le profil mais le niveau oral est à confirmer lors de la prochaine séance."
                  rows={3}
                  className="mt-1"
                />
              </div>
              {!diagnostic.teacher_validated ? (
                <div className="flex gap-3 flex-wrap">
                  <Button onClick={handleValidate} className="gap-1.5"><CheckCircle className="h-4 w-4" />Valider la synthèse</Button>
                  <Button variant="outline" onClick={() => entities.Diagnostic.update(diagnosticId, { reliability_label: "a_confirmer", workflow_status: "a_confirmer" })}>
                    Marquer "À confirmer"
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-700 text-sm">
                  <CheckCircle className="h-4 w-4" />Synthèse validée par le professeur.
                </div>
              )}
            </div>
          </Collapsible>

          {/* ━━━ 11. RAPPORTS & EXPORTS ━━━ */}
          <Collapsible title="Rapports et exports">
            <div className="space-y-4 mt-1">
              <p className="text-sm text-muted-foreground">Générez les documents pédagogiques à partager ou à archiver.</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    type: "teacher",
                    label: "Brief professeur",
                    desc: "Synthèse complète avec profil, méthode, priorités, plan et watchlist.",
                    icon: BookOpen,
                  },
                  {
                    type: "parent",
                    label: "Rapport parent",
                    desc: "Résumé clair sans jargon, avec conseils maison personnalisés.",
                    icon: Eye,
                  },
                  {
                    type: "learner",
                    label: "Résumé apprenant",
                    desc: `Résumé sans jargon adapté au profil ${profile === "child" ? "enfant" : profile === "teen" ? "adolescent" : "adulte / étudiant"}.`,
                    icon: Target,
                  },
                ].map(({ type, label, desc, icon: Icon }) => (
                  <div key={type} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-primary" />
                        <p className="font-medium text-sm">{label}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!result || generatingReport === type}
                      onClick={() => generateAndSaveReport(type)}
                      className="gap-1.5 mt-auto"
                    >
                      {generatingReport === type
                        ? <><div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />Génération…</>
                        : <><FileText className="h-3.5 w-3.5" />Générer</>
                      }
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />Imprimer / PDF
                </Button>
                <Link to="/reports">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <BookOpen className="h-4 w-4" />Voir tous les rapports
                  </Button>
                </Link>
              </div>
            </div>
          </Collapsible>
        </>
      )}
    </div>
  );
}