// STEM Compass — Moteur de workflow centralisé
// Utilisé dans Dashboard, TeacherDiagnosticOverview, LearnerProfile, DiagnosticResults

/**
 * Calcule l'état pédagogique réel d'un diagnostic à partir de toutes les données disponibles.
 *
 * @param {object} diagnostic
 * @param {array}  links        DiagnosticAccessLink[]
 * @param {array}  responses    DiagnosticResponse[]
 * @param {object} completion   DiagnosticCompletionStatus
 * @param {object} result       DiagnosticResult | null
 * @param {array}  reports      Report[]
 * @returns {object} WorkflowState
 */
export function computeDiagnosticWorkflow(diagnostic, links = [], responses = [], completion = null, result = null, reports = []) {
  if (!diagnostic) return null;

  const learnerLink = links.find(l => l.respondent_type === "learner");
  const parentLink  = links.find(l => l.respondent_type === "parent");
  const teacherLink = links.find(l => l.respondent_type === "teacher");

  const needsParent = diagnostic.includes_parent_section || diagnostic.learner_profile_type === "child";

  const learnerResponses = responses.filter(r => r.respondent_type === "learner");
  const teacherResponses = responses.filter(r => r.section_key === "teacher_observation");
  const parentResponses  = responses.filter(r => r.section_key === "parent_context");
  const minitestResponses = responses.filter(r => r.section_key?.includes("mini_tasks"));

  const learnerDone   = completion?.learner_section_completed || learnerLink?.status === "completed" || learnerResponses.length >= 3;
  const parentDone    = !needsParent || completion?.parent_section_completed || parentLink?.status === "completed" || parentResponses.length >= 2;
  const teacherDone   = completion?.teacher_section_completed || teacherLink?.status === "completed" || teacherResponses.length >= 1;
  const minitaskDone  = completion?.mini_task_completed || minitestResponses.length >= 1;
  const hasResult     = !!result;
  const validated     = diagnostic.teacher_validated || result?.teacher_validated;
  const hasReports    = reports.length > 0;
  const learnerOpened = learnerLink?.status === "opened" || learnerLink?.opened_at;

  // Missing parts
  const missing_parts = [];
  if (!learnerDone) missing_parts.push({ key: "learner", label: "Partie apprenant" });
  if (needsParent && !parentDone) missing_parts.push({ key: "parent", label: "Partie parent" });
  if (!teacherDone) missing_parts.push({ key: "teacher", label: "Observation professeur" });
  if (!minitaskDone) missing_parts.push({ key: "mini_tasks", label: "Mini-tâches" });

  const can_generate_partial_synthesis = learnerDone && !hasResult;
  const can_generate_full_synthesis    = learnerDone && (parentDone || !needsParent) && teacherDone;

  const reliability_warning = !teacherDone
    ? "L'observation professeur est absente — fiabilité maximale : assez fiable."
    : (needsParent && !parentDone)
    ? "La partie parent est absente — le contexte familial peut être incomplet."
    : null;

  // Compute workflow_status
  let workflow_status;
  if (!learnerLink) {
    workflow_status = "prepared";
  } else if (!learnerOpened && !learnerDone) {
    workflow_status = "learner_link_ready";
  } else if (learnerOpened && !learnerDone) {
    workflow_status = "learner_started";
  } else if (learnerDone && needsParent && !parentDone && !teacherDone) {
    workflow_status = "parent_recommended";
  } else if (learnerDone && !teacherDone) {
    workflow_status = "teacher_observation_needed";
  } else if (learnerDone && teacherDone && (parentDone || !needsParent) && !hasResult) {
    workflow_status = "ready_for_synthesis";
  } else if (learnerDone && !hasResult && !teacherDone) {
    workflow_status = "partial_synthesis_possible";
  } else if (hasResult && !validated) {
    workflow_status = "synthesis_generated";
  } else if (validated && !hasReports) {
    workflow_status = "teacher_validated";
  } else if (validated && hasReports) {
    workflow_status = "reports_generated";
  } else {
    workflow_status = "prepared";
  }

  // Human labels
  const HUMAN_LABELS = {
    prepared:                    "Session préparée — lien à envoyer",
    learner_link_ready:          "Lien envoyé — en attente d'ouverture",
    learner_started:             "Apprenant en cours de réponse",
    learner_completed:           "Réponses apprenant reçues",
    parent_recommended:          "Parent à contacter",
    parent_completed:            "Parent a répondu",
    teacher_observation_needed:  "Observation professeur à compléter",
    partial_synthesis_possible:  "Synthèse partielle possible",
    ready_for_synthesis:         "Prête pour synthèse complète",
    synthesis_generated:         "Synthèse générée — à valider",
    teacher_validated:           "Synthèse validée — rapports à générer",
    reports_generated:           "Rapports prêts",
    shared:                      "Rapports partagés",
    archived:                    "Archivée",
  };

  const human_status_label = HUMAN_LABELS[workflow_status] || workflow_status;

  // Next action
  let next_action_label = "";
  let next_action_url   = "";
  const diagId = diagnostic.id;

  if (workflow_status === "prepared" || workflow_status === "learner_link_ready") {
    next_action_label = "Copier le lien apprenant";
    next_action_url   = learnerLink ? `copy:${learnerLink.token}` : `generate:learner`;
  } else if (workflow_status === "learner_started") {
    next_action_label = "Attendre les réponses";
  } else if (workflow_status === "parent_recommended") {
    next_action_label = "Envoyer le lien parent";
    next_action_url   = parentLink ? `copy:${parentLink.token}` : `generate:parent`;
  } else if (workflow_status === "teacher_observation_needed") {
    next_action_label = "Compléter l'observation";
    next_action_url   = `/diagnostics/${diagId}/session?role=teacher`;
  } else if (workflow_status === "partial_synthesis_possible") {
    next_action_label = "Générer la synthèse partielle";
    next_action_url   = `/diagnostics/${diagId}/results`;
  } else if (workflow_status === "ready_for_synthesis") {
    next_action_label = "Générer la synthèse complète";
    next_action_url   = `/diagnostics/${diagId}/results`;
  } else if (workflow_status === "synthesis_generated") {
    next_action_label = "Valider la synthèse";
    next_action_url   = `/diagnostics/${diagId}/results`;
  } else if (workflow_status === "teacher_validated") {
    next_action_label = "Générer les rapports";
    next_action_url   = `/diagnostics/${diagId}/results`;
  } else if (workflow_status === "reports_generated") {
    next_action_label = "Voir les rapports";
    next_action_url   = `/reports`;
  }

  return {
    workflow_status,
    human_status_label,
    next_action_label,
    next_action_url,
    missing_parts,
    can_generate_partial_synthesis,
    can_generate_full_synthesis,
    reliability_warning,
    learnerDone,
    parentDone,
    teacherDone,
    miniTaskDone: minitaskDone,
    hasResult,
    validated,
    hasReports,
  };
}

/**
 * Returns a Tailwind CSS classes string for a workflow_status badge
 */
export function getWorkflowStatusStyle(status) {
  const map = {
    prepared:                   "bg-secondary text-muted-foreground border-border",
    learner_link_ready:         "bg-amber-50 text-amber-700 border-amber-200",
    learner_started:            "bg-blue-50 text-blue-600 border-blue-200",
    learner_completed:          "bg-blue-50 text-blue-700 border-blue-200",
    parent_recommended:         "bg-orange-50 text-orange-700 border-orange-200",
    parent_completed:           "bg-orange-50 text-orange-600 border-orange-200",
    teacher_observation_needed: "bg-amber-50 text-amber-700 border-amber-200",
    partial_synthesis_possible: "bg-indigo-50 text-indigo-700 border-indigo-200",
    ready_for_synthesis:        "bg-emerald-50 text-emerald-700 border-emerald-200",
    synthesis_generated:        "bg-emerald-50 text-emerald-700 border-emerald-200",
    teacher_validated:          "bg-primary/10 text-primary border-primary/20",
    reports_generated:          "bg-primary/10 text-primary border-primary/20",
    shared:                     "bg-primary/10 text-primary border-primary/20",
    archived:                   "bg-secondary text-muted-foreground border-border",
  };
  return map[status] || map.prepared;
}