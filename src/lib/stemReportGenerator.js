/**
 * STEM Compass — Générateur de rapports pédagogiques
 * Teacher brief, parent report, learner summary
 * No FLE terminology. Domain-aware.
 */

function formatDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
}

function formatReliability(label) {
  const map = {
    fiable: "Synthèse solide",
    assez_fiable: "Synthèse assez fiable",
    partiel: "Synthèse partielle",
    a_confirmer: "À confirmer",
  };
  return map[label] || label || "À confirmer";
}

const DOMAIN_LABELS = {
  mathematics: "Mathématiques",
  computer_science: "Informatique",
  mixed: "Maths & Informatique",
};

// ━━━━━━━━━━━━━━━━━━━━
// BRIEF PROFESSEUR
// ━━━━━━━━━━━━━━━━━━━━
export function generateTeacherReport(result, diagnostic, learner) {
  const name = learner?.display_name || learner?.first_name || "L'élève";
  const date = formatDate(diagnostic?.created_date || new Date());
  const mode = { express: "Express", standard: "Standard", complete: "Complet" }[diagnostic?.diagnostic_mode] || "Standard";
  const profil = { child: "Enfant", teen: "Adolescent", adult: "Adulte / Étudiant" }[diagnostic?.learner_profile_type] || "Adulte";
  const domain = DOMAIN_LABELS[diagnostic?.domain || "mathematics"];
  const plan = result.four_week_plan || [];
  const watchlist = result.error_watchlist || [];
  const domainTags = result.domain_tags || [];

  // Actionable 6-line synthesis
  const synthLines = [
    result.profile_label ? `Profil pédagogique : ${result.profile_label}.` : "",
    result.learner_personal_goal_text ? `Objectif déclaré : ${result.learner_personal_goal_text}.` : "",
    result.main_blockage_text ? `Blocage principal : ${result.main_blockage_text}.` : "",
    result.error_reaction ? `Rapport à l'erreur : ${result.error_reaction}.` : "",
    result.teacher_posture ? `Posture recommandée : ${result.teacher_posture}.` : "",
    result.first_lesson_angle_text ? `Par où commencer : ${result.first_lesson_angle_text}` : "",
  ].filter(Boolean).slice(0, 6);

  const sections = {
    header: { title: `Brief pédagogique — ${name}`, learner: name, date, profil, mode, domain, reliability: formatReliability(result.reliability_label) },

    synthesis: {
      title: "Synthèse actionnable",
      lines: synthLines,
      profile_summary: result.global_profile_summary || "",
    },

    understanding: {
      title: "Ce qu'il faut comprendre sur cet élève",
      items: [
        result.learner_personal_goal_text && { label: "Objectif réel", value: result.learner_personal_goal_text },
        result.success_indicator_text && { label: "Réussite attendue", value: result.success_indicator_text },
        result.main_blockage_text && { label: "Blocage principal", value: result.main_blockage_text },
        result.error_reaction && { label: "Rapport à l'erreur", value: result.error_reaction },
        { label: "Autonomie estimée", value: result.autonomy_score >= 70 ? "Bonne" : result.autonomy_score >= 40 ? "Partielle" : "Faible" },
        { label: "Confiance estimée", value: result.confidence_score >= 70 ? "Bonne" : result.confidence_score >= 40 ? "Fragile" : "Basse" },
        { label: "Domaine", value: domain },
        result.parent_support_notes && { label: "Observation parent", value: result.parent_support_notes },
      ].filter(Boolean),
    },

    how_to_start: {
      title: "Comment commencer",
      angle: result.first_lesson_angle_text || "À définir après observation.",
      activity1: result.recommended_first_activity || "",
      guidage: result.teacher_posture || "",
      posture: result.teacher_posture || "",
      guidage_level: result.autonomy_score >= 70 ? "Semi-autonome" : result.autonomy_score >= 40 ? "Guidé avec exemples" : "Très guidé",
    },

    method: {
      title: "Méthode recommandée",
      text: result.recommended_method_text || "",
      activities: result.recommended_activities || [],
    },

    correction: {
      title: "Stratégie de correction recommandée",
      text: result.correction_strategy || "",
    },

    avoid: {
      title: "Ce qu'il faut éviter",
      items: result.avoid_list || [],
    },

    domain_tags: {
      title: "Tags spécifiques au domaine",
      items: domainTags,
    },

    watchlist: {
      title: "Watchlist — erreurs et comportements à surveiller",
      items: watchlist,
    },

    skill_estimate: {
      title: "Compétences estimées",
      available: result.skill_estimate_available,
      note: result.skill_estimate_note || "",
      dimensions: result.skill_estimate_dimensions || [],
    },

    priorities: {
      title: "Priorités pédagogiques",
      items: result.priority_areas || [],
    },

    four_week_plan: {
      title: "Plan de travail — 4 semaines",
      weeks: plan,
    },

    reliability: {
      title: "Fiabilité de la synthèse",
      label: formatReliability(result.reliability_label),
      missing: result.missing_evidence || [],
    },
  };

  const text = buildTeacherText(sections, name, mode, domain);
  return { sections, text, title: `Brief pédagogique — ${name} — ${date}` };
}

function buildTeacherText(s, name, mode, domain) {
  return `BRIEF PÉDAGOGIQUE — ${name.toUpperCase()}
Date : ${s.header.date} · Profil : ${s.header.profil} · ${mode} · Domaine : ${domain}
Fiabilité : ${s.header.reliability}

━━━━━━━━━━━━━━━━━━━━
SYNTHÈSE ACTIONNABLE
━━━━━━━━━━━━━━━━━━━━
${s.synthesis.lines.join("\n")}

${s.synthesis.profile_summary}

━━━━━━━━━━━━━━━━━━━━
CE QU'IL FAUT COMPRENDRE
━━━━━━━━━━━━━━━━━━━━
${s.understanding.items.map(i => `${i.label} : ${i.value}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━
COMMENT COMMENCER
━━━━━━━━━━━━━━━━━━━━
Angle d'entrée : ${s.how_to_start.angle}
Première activité : ${s.how_to_start.activity1}
Posture : ${s.how_to_start.posture}
Niveau de guidage : ${s.how_to_start.guidage_level}

━━━━━━━━━━━━━━━━━━━━
MÉTHODE RECOMMANDÉE
━━━━━━━━━━━━━━━━━━━━
${s.method.text}
Activités : ${s.method.activities.join(" · ")}

━━━━━━━━━━━━━━━━━━━━
STRATÉGIE DE CORRECTION
━━━━━━━━━━━━━━━━━━━━
${s.correction.text}

━━━━━━━━━━━━━━━━━━━━
CE QU'IL FAUT ÉVITER
━━━━━━━━━━━━━━━━━━━━
${s.avoid.items.map(a => `• ${a}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━
WATCHLIST
━━━━━━━━━━━━━━━━━━━━
${s.watchlist.items.map(w => `• ${w.name} (${w.type}) — ${w.why}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━
PLAN 4 SEMAINES
━━━━━━━━━━━━━━━━━━━━
${s.four_week_plan.weeks.map(w => `Semaine ${w.week} — ${w.title}\nObjectif : ${w.objective}\nActivités : ${w.activities}\nÀ surveiller : ${w.monitor}`).join("\n\n")}

━━━━━━━━━━━━━━━━━━━━
COMPÉTENCES ESTIMÉES
━━━━━━━━━━━━━━━━━━━━
${s.skill_estimate.available
    ? s.skill_estimate.dimensions.map(d => `${d.label} : ${d.value}`).join("\n")
    : s.skill_estimate.note}`;
}

// ━━━━━━━━━━━━━━━━━━━━
// RAPPORT PARENT
// ━━━━━━━━━━━━━━━━━━━━
export function generateParentReport(result, diagnostic, learner) {
  const name = learner?.display_name || learner?.first_name || "votre enfant";
  const date = formatDate(diagnostic?.created_date || new Date());
  const ageGroup = diagnostic?.learner_profile_type || "adult";
  const domain = DOMAIN_LABELS[diagnostic?.domain || "mathematics"];
  const isCS = diagnostic?.domain === "computer_science";

  const sections = {
    intro: {
      title: "Ce que ce parcours aide à comprendre",
      text: `Le diagnostic STEM Compass aide le professeur à comprendre comment ${name} raisonne en ${domain.toLowerCase()}, où il/elle bloque, comment il/elle réagit face aux difficultés et quelle méthode sera la plus efficace pour progresser. Ce n'est pas un test de niveau — c'est un outil de préparation pédagogique.`,
    },
    strengths: {
      title: `Ce que ${name} sait déjà faire`,
      items: buildParentStrengths(result, ageGroup),
    },
    difficulties: {
      title: "Ce qui bloque actuellement",
      items: buildParentDifficulties(result, ageGroup),
    },
    teacher_plan: {
      title: "Ce que le professeur va travailler",
      text: result.recommended_method_text || "Le professeur travaillera les priorités identifiées.",
      first_lesson: result.first_lesson_angle_text || "",
      priorities: (result.priority_areas || []).map(p => p.title).slice(0, 3),
    },
    home_help: {
      title: "Comment aider à la maison",
      items: buildParentHomeHelp(result, ageGroup, isCS, name),
    },
    avoid: {
      title: "Ce qu'il vaut mieux éviter",
      items: buildParentAvoid(result, ageGroup, isCS, name),
    },
    next: {
      title: "Prochaine étape",
      text: buildParentNextStep(name, result),
    },
  };

  const text = buildParentText(sections, name, date, domain);
  return { sections, text, title: `Rapport parent — ${name} — ${date}` };
}

function buildParentStrengths(result, ageGroup) {
  const s = [];
  if (result.confidence_score >= 60) s.push("Fait preuve d'une certaine confiance dans les exercices connus");
  if (result.autonomy_score >= 60) s.push("Peut travailler de manière assez autonome sur les sujets déjà vus");
  if (result.learner_personal_goal_text) s.push(`A un objectif clair : ${result.learner_personal_goal_text}`);
  if (result.main_profile_type === "raisonnement_prometteur") s.push("Montre un raisonnement intuitif réel même si encore peu structuré");
  if (result.main_profile_type === "profil_autonome") s.push("Comprend rapidement et peut expliquer ses démarches");
  if (s.length === 0) s.push("Participe et répond aux questions du parcours — bonne disposition à l'accompagnement");
  s.push("A complété le parcours de diagnostic — première étape d'un accompagnement personnalisé");
  return s.slice(0, 4);
}

function buildParentDifficulties(result, ageGroup) {
  const d = [];
  if (result.main_blockage_text) d.push(result.main_blockage_text);
  if (result.main_profile_type === "panique_face_erreur") d.push("La réaction aux erreurs : tendance à se bloquer ou à se dévaloriser");
  if (result.main_profile_type === "blocage_enonce") d.push("Lire et comprendre ce qu'on lui demande avant de commencer");
  if (result.main_profile_type === "manque_bases") d.push("Certains prérequis semblent fragiles et génèrent des erreurs en cascade");
  if (result.autonomy_score < 35) d.push("Travailler seul sur des exercices nouveaux");
  if (d.length === 0) d.push("Des difficultés à préciser lors de la première séance");
  return d.slice(0, 4);
}

function buildParentHomeHelp(result, ageGroup, isCS, name) {
  const items = [
    `Demander à ${name} de reformuler ce qu'on lui demande avant de commencer un exercice`,
    "Valoriser la démarche plutôt que le résultat : 'Comment tu t'y es pris ?' plutôt que 'C'est faux'",
    "Éviter de donner la réponse directement — poser la question : 'Qu'as-tu déjà essayé ?'",
  ];
  if (result.main_profile_type === "panique_face_erreur") {
    items.push("Normaliser les erreurs : 'Cette erreur nous apprend que...' plutôt que 'Tu t'es trompé'");
    items.push("Ne pas mettre la pression sur la vitesse ou les résultats");
  }
  if (isCS) {
    items.push("Si le code ne marche pas, demander d'abord : 'Qu'est-ce que dit le message d'erreur ?'");
    items.push("Encourager à chercher seul 5-10 minutes avant de demander de l'aide");
  } else {
    items.push("Pour les devoirs, demander de lire l'énoncé deux fois et d'expliquer ce qu'on cherche");
  }
  if (ageGroup === "child") items.push("Encourager chaque petit progrès — la confiance est aussi importante que le niveau");
  return items.slice(0, 5);
}

function buildParentAvoid(result, ageGroup, isCS, name) {
  const items = [
    "Transformer les devoirs en interrogation : ne pas évaluer, mais accompagner",
    "Corriger chaque erreur immédiatement — laisser chercher",
    "Comparer avec d'autres élèves",
  ];
  if (result.main_profile_type === "panique_face_erreur") items.unshift("Réagir négativement à une erreur — même avec les meilleures intentions");
  if (isCS) items.push("Donner directement la solution quand le code ne marche pas");
  else items.push("Résoudre les exercices à la place de l'élève pour aller plus vite");
  if (ageGroup === "child") items.push("Forcer à travailler quand l'élève est épuisé ou stressé");
  return items.slice(0, 5);
}

function buildParentNextStep(name, result) {
  const plan = result.four_week_plan?.[0];
  if (plan) return `Le premier objectif sur les prochaines semaines : ${plan.objective}. ${name} est en bonne voie. La régularité et un environnement de travail sécurisant sont les deux leviers les plus importants à ce stade.`;
  return `Suivre le plan sur 4 semaines, observer les progrès, et faire un bilan avec le professeur. ${name} bénéficiera d'un accompagnement personnalisé à partir des informations recueillies.`;
}

function buildParentText(s, name, date, domain) {
  return `RAPPORT PARENT — ${name.toUpperCase()}
Date : ${date} · Domaine : ${domain}

━━━━━━━━━━━━━━━━━━━━
${s.intro.title}
━━━━━━━━━━━━━━━━━━━━
${s.intro.text}

━━━━━━━━━━━━━━━━━━━━
${s.strengths.title}
━━━━━━━━━━━━━━━━━━━━
${s.strengths.items.map(i => `• ${i}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━
${s.difficulties.title}
━━━━━━━━━━━━━━━━━━━━
${s.difficulties.items.map(i => `• ${i}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━
${s.teacher_plan.title}
━━━━━━━━━━━━━━━━━━━━
${s.teacher_plan.text}
Première séance : ${s.teacher_plan.first_lesson}
Priorités : ${s.teacher_plan.priorities.join(", ")}

━━━━━━━━━━━━━━━━━━━━
${s.home_help.title}
━━━━━━━━━━━━━━━━━━━━
${s.home_help.items.map(i => `• ${i}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━
${s.avoid.title}
━━━━━━━━━━━━━━━━━━━━
${s.avoid.items.map(i => `• ${i}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━
${s.next.title}
━━━━━━━━━━━━━━━━━━━━
${s.next.text}`;
}

// ━━━━━━━━━━━━━━━━━━━━
// RÉSUMÉ ÉLÈVE
// ━━━━━━━━━━━━━━━━━━━━
export function generateLearnerReport(result, diagnostic, learner) {
  const name = learner?.display_name || learner?.first_name || "toi";
  const ageGroup = diagnostic?.learner_profile_type || "adult";
  const date = formatDate(diagnostic?.created_date || new Date());
  const domain = DOMAIN_LABELS[diagnostic?.domain || "mathematics"];
  const plan = result.four_week_plan || [];

  if (ageGroup === "child") return generateChildReport(result, name, date, domain);
  if (ageGroup === "teen") return generateTeenReport(result, name, date, domain, plan);
  return generateAdultReport(result, name, date, domain, plan);
}

function generateChildReport(result, name, date, domain) {
  const sections = {
    title: "Ce qu'on va travailler ensemble",
    already: {
      title: "Ce que tu sais déjà faire",
      text: result.confidence_score >= 60
        ? `Tu montres de la confiance dans les exercices que tu connais. C'est une bonne base.`
        : `Tu essaies et tu réponds aux questions. C'est déjà beaucoup.`,
    },
    help: {
      title: "Ce qui va t'aider",
      text: result.recommended_method_text?.split(".")[0] || "On va trouver une méthode qui te correspond.",
    },
    mission: {
      title: "Ta première mission",
      text: result.first_lesson_angle_text || result.next_session_focus_text || "On commence ensemble lors de la prochaine séance.",
    },
  };
  const text = `POUR ${name.toUpperCase()} — ${domain}\n\n${sections.already.title}\n${sections.already.text}\n\n${sections.help.title}\n${sections.help.text}\n\n${sections.mission.title}\n${sections.mission.text}`;
  return { sections, text, title: `Mon parcours — ${name}` };
}

function generateTeenReport(result, name, date, domain, plan) {
  const week1 = plan[0];
  const sections = {
    title: "Ton point de départ",
    goal: { title: "Ton objectif", text: result.learner_personal_goal_text || "À préciser avec ton professeur." },
    block: { title: "Ce qui bloque actuellement", text: result.main_blockage_text || "À confirmer lors de la première séance." },
    method: { title: "Comment on va travailler", text: result.recommended_method_text?.split(".")[0] || "Méthode à définir." },
    first_mission: {
      title: "Première mission",
      text: week1 ? `${week1.title} — ${week1.objective}` : result.next_session_focus_text || "À définir en séance.",
    },
  };
  const text = `TON POINT DE DÉPART — ${name.toUpperCase()} · ${domain}\n\nObjectif : ${sections.goal.text}\n\nCe qui bloque : ${sections.block.text}\n\nComment on va travailler : ${sections.method.text}\n\nPremière mission : ${sections.first_mission.text}`;
  return { sections, text, title: `Mon point de départ — ${name}` };
}

function generateAdultReport(result, name, date, domain, plan) {
  const sections = {
    title: "Votre plan de départ",
    objective: { title: "Objectif", text: result.learner_personal_goal_text || "À préciser avec votre accompagnateur." },
    priority: { title: "Priorité identifiée", text: result.main_blockage_text || result.profile_label || "À confirmer lors de la première séance." },
    method: { title: "Méthode recommandée", text: result.recommended_method_text || "À définir." },
    first_step: { title: "Première étape", text: result.first_lesson_angle_text || result.next_session_focus_text || "" },
    plan: {
      title: "Plan sur 4 semaines",
      weeks: plan.map(w => `Semaine ${w.week} : ${w.objective}`),
    },
  };
  const text = `VOTRE PLAN DE DÉPART — ${name.toUpperCase()} · ${domain}\n\nObjectif : ${sections.objective.text}\n\nPriorité : ${sections.priority.text}\n\nMéthode : ${sections.method.text}\n\nPremière étape : ${sections.first_step.text}\n\nPlan :\n${sections.plan.weeks.join("\n")}`;
  return { sections, text, title: `Mon plan de départ — ${name}` };
}