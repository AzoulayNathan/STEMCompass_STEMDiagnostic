import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { entities, setSessionToken } from "@/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Shield } from "lucide-react";
import { getSectionsForDomain, getQuestionsForSession } from "@/lib/questionBank";

function AnswerOption({ opt, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(opt)}
      className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
        selected ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:bg-secondary/40"
      }`}
    >
      {opt}
    </button>
  );
}

function MultiAnswerOption({ opt, selected, onToggle }) {
  return (
    <button
      onClick={() => onToggle(opt)}
      className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
        selected ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:bg-secondary/40"
      }`}
    >
      {opt}
    </button>
  );
}

function QuestionBlock({ question, value, onChange, profile }) {
  const text = (profile === "child" && (question.text_child || question.question_text_child))
    ? (question.text_child || question.question_text_child)
    : (profile === "teen" && question.text_teen)
    ? question.text_teen
    : (question.text || question.question_text || "");
  const options = question.options || (() => {
    try { return JSON.parse(question.options_json || "[]"); } catch { return []; }
  })();

  let selected = [];
  try { selected = typeof value === "string" && value.startsWith("[") ? JSON.parse(value) : (value ? [value] : []); } catch { selected = value ? [value] : []; }

  if (question.answer_type === "single_choice" || question.answer_type === "yes_no") {
    return (
      <div className="space-y-2">
        {options.map((opt, i) => <AnswerOption key={i} opt={opt} selected={value === opt} onSelect={v => onChange(v)} />)}
      </div>
    );
  }

  if (question.answer_type === "multiple_choice") {
    const toggle = (opt) => {
      const arr = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt];
      onChange(JSON.stringify(arr));
    };
    return (
      <div className="grid sm:grid-cols-2 gap-2">
        {options.map((opt, i) => <MultiAnswerOption key={i} opt={opt} selected={selected.includes(opt)} onToggle={toggle} />)}
      </div>
    );
  }

  if (question.answer_type === "short_text" || question.answer_type === "long_text" || question.answer_type === "sentence_completion") {
    return (
      <textarea
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        rows={question.answer_type === "long_text" ? 4 : 2}
        placeholder="Votre réponse…"
        className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
      />
    );
  }

  if (question.answer_type === "scale") {
    const scale = [1, 2, 3, 4, 5];
    return (
      <div className="flex gap-3">
        {scale.map(n => (
          <button key={n} onClick={() => onChange(String(n))} className={`h-10 w-10 rounded-full border text-sm font-medium transition-colors ${value === String(n) ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-secondary/40"}`}>
            {n}
          </button>
        ))}
      </div>
    );
  }

  return null;
}

// Kept for reference — actual filtering now done via getQuestionsForSession in useEffect
function buildQuestionList() { return []; }

export default function DiagnosticSession() {
  const { diagnosticId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const respondentRole = searchParams.get("role") || "teacher";
  const profileOverride = searchParams.get("profile");
  const token = searchParams.get("token");

  const [diagnostic, setDiagnostic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingResponses, setExistingResponses] = useState([]);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (token) setSessionToken(token);
    Promise.all([
      entities.Diagnostic.get(diagnosticId),
      entities.DiagnosticResponse.filter({ diagnostic_id: diagnosticId }),
    ]).then(([d, responses]) => {
      setDiagnostic(d);
      setExistingResponses(responses);
      const profile = profileOverride || d.learner_profile_type || "adult";
      const mode = d.diagnostic_mode || "standard";
      const domain = d.domain || "mathematics";
      const sections = (d.selected_modules?.length > 0) ? d.selected_modules : getSectionsForDomain(domain, profile, mode);
      const qList = getQuestionsForSession({ domain, profile, respondentType: respondentRole, mode, sections });
      setQuestions(qList);

      const initial = {};
      for (const r of responses) {
        if (r.response_value || r.response_text) {
          initial[r.question_key] = r.response_value || r.response_text;
        }
      }
      setAnswers(initial);
      setLoading(false);
    });
  }, [diagnosticId, respondentRole, profileOverride]);

  const saveAnswer = useCallback(async (questionKey, value, sectionKey) => {
    const existing = existingResponses.find(r => r.question_key === questionKey && r.respondent_type === respondentRole);
    const isLongText = typeof value === "string" && value.length >= 80 && !value.startsWith("[");
    const source = token ? "shared_link" : respondentRole === "teacher" ? "direct_teacher" : "admin";
    const data = {
      diagnostic_id: diagnosticId,
      section_key: sectionKey,
      question_key: questionKey,
      response_value: isLongText ? undefined : value,
      response_text: isLongText ? value : undefined,
      respondent_type: respondentRole,
      source,
      answered_at: new Date().toISOString(),
    };
    if (existing) {
      await entities.DiagnosticResponse.update(existing.id, data);
    } else {
      const newR = await entities.DiagnosticResponse.create(data);
      setExistingResponses(prev => [...prev, newR]);
    }
  }, [diagnosticId, existingResponses, respondentRole, token]);

  const handleAnswer = (value) => {
    const q = questions[currentIdx];
    if (!q) return;
    const qKey = q.id || q.question_id || `q_${currentIdx}`;
    setAnswers(prev => ({ ...prev, [qKey]: value }));

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      await saveAnswer(qKey, value, q.section_key);
      setSaving(false);
    }, 600);
  };

  const handleComplete = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const profileNow = profileOverride || diagnostic?.learner_profile_type || "adult";

    const completionList = await entities.DiagnosticCompletionStatus.filter({ diagnostic_id: diagnosticId });
    const completion = completionList?.[0];
    const hasMiniTasks = Object.keys(answers).some(k => k.startsWith("mt_math_") || k.startsWith("mt_cs_") || k.startsWith("mt_"));
    const hasReasoning = Object.keys(answers).some(k =>
      ["block_01","block_02","meth_01","meth_02","meth_03","math_01","math_02","math_03","cs_01","cs_02","cs_03"].includes(k)
    );
    const hasExplanation = Object.values(answers).some(v => typeof v === "string" && v.length > 30 && !v.startsWith("["));

    const completionUpdate = { diagnostic_id: diagnosticId, last_activity_at: now };
    if (respondentRole === "learner") {
      completionUpdate.learner_section_completed = true;
      completionUpdate.learner_completed_at = now;
      completionUpdate.mini_task_completed = hasMiniTasks;
      completionUpdate.reasoning_task_completed = hasReasoning;
      completionUpdate.explanation_task_completed = hasExplanation;
    } else if (respondentRole === "parent") {
      completionUpdate.parent_section_completed = true;
      completionUpdate.parent_completed_at = now;
    } else if (respondentRole === "teacher") {
      completionUpdate.teacher_section_completed = true;
      completionUpdate.teacher_completed_at = now;
    }

    if (completion) {
      await entities.DiagnosticCompletionStatus.update(completion.id, completionUpdate);
    } else {
      await entities.DiagnosticCompletionStatus.create({ diagnostic_id: diagnosticId, ...completionUpdate });
    }

    setSaving(false);
    if (respondentRole === "teacher") {
      navigate(`/diagnostics/${diagnosticId}/overview`);
    } else {
      navigate(`/session/complete?role=${respondentRole}&profile=${profileNow}&diagnostic=${diagnosticId}`);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!diagnostic) return <div className="p-10 text-center text-muted-foreground">Session introuvable.</div>;
  if (questions.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-muted-foreground">Aucune question disponible pour ce rôle et ce mode.</p>
      <Button onClick={handleComplete} variant="outline">Terminer</Button>
    </div>
  );

  const q = questions[currentIdx];
  const qKey = q.id || q.question_id || `q_${currentIdx}`;
  const currentValue = answers[qKey] || "";
  const progress = Math.round(((currentIdx + 1) / questions.length) * 100);
  const profile = profileOverride || diagnostic.learner_profile_type || "adult";
  const isLast = currentIdx === questions.length - 1;
  const questionText = (profile === "child" && (q.text_child || q.question_text_child))
    ? (q.text_child || q.question_text_child)
    : (profile === "teen" && q.text_teen)
    ? q.text_teen
    : (q.text || q.question_text || "");

  const ROLE_HELP = {
    learner: "Ces questions et tâches rapides aident le professeur à mieux comprendre vos besoins.",
    parent: "Vos réponses aident le professeur à adapter son accompagnement au contexte de votre enfant.",
    teacher: "Votre observation complète la synthèse pédagogique et améliore la fiabilité des recommandations.",
  };
  const ROLE_LABELS = { learner: "Partie apprenant", parent: "Partie parent", teacher: "Observation professeur" };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card/80 border-b border-border backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 py-3">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-primary px-2 py-0.5 rounded-full bg-primary/8 border border-primary/15">
                {ROLE_LABELS[respondentRole] || "Session"}
              </span>
              {diagnostic.learner_name && <span className="text-xs text-muted-foreground">{diagnostic.learner_name}</span>}
            </div>
            <span className="text-xs text-muted-foreground">{currentIdx + 1} / {questions.length}</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center px-5 py-8 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          {q.section_key && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {{
                common_goal: "Objectif réel",
                common_blocage: "Blocage principal",
                common_error: "Rapport à l'erreur",
                common_method: "Méthode de travail",
                math_profile: "Profil mathématiques",
                cs_profile: "Profil informatique",
                math_mini_tasks: "Mini-tâches mathématiques",
                cs_mini_tasks: "Mini-tâches informatique",
                parent_context: "Contexte parent",
                teacher_observation: "Observation professeur",
              }[q.section_key] || q.section_key.replace(/_/g, " ")}
            </p>
          )}
          <h2 className="font-serif text-xl md:text-2xl font-semibold leading-snug">{questionText}</h2>
          {q.help_text && (
            <div className="flex items-start gap-2 bg-secondary/50 rounded-lg p-3">
              <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{q.help_text}</p>
            </div>
          )}
          <QuestionBlock question={q} value={currentValue} onChange={handleAnswer} profile={profile} />

          {q.required_status === "optional" && (
            <p className="text-xs text-muted-foreground">Cette question est optionnelle. Vous pouvez la passer.</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t border-border bg-card/80 sticky bottom-0">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />Précédent
          </Button>
          <div className="flex items-center gap-2">
            {saving && <span className="text-xs text-muted-foreground">Enregistrement…</span>}
            {isLast ? (
              <Button onClick={handleComplete} disabled={saving} className="gap-1.5">
                <Check className="h-4 w-4" />Terminer
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                className="gap-1.5"
              >
                Suivant <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}