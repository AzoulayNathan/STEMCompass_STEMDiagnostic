/**
 * STEM Compass — Moteur de scoring pédagogique
 * Domain: mathematics | computer_science | mixed
 * Profiles: child | teen | adult
 *
 * Principle: Never invent a precise level with insufficient data.
 * Two separate outputs:
 *   - learner_understanding: what we know about how this learner learns
 *   - skill_estimate: cautious estimation of competencies (only with mini-tasks)
 */

// ─── Utils ─────────────────────────────────────────────────────────────────
function parseResponses(responses) {
  const bySection = {};
  for (const r of responses) {
    if (!bySection[r.section_key]) bySection[r.section_key] = {};
    bySection[r.section_key][r.question_key] = r.response_value || r.response_text || "";
  }
  return bySection;
}

function tryParseArray(val) {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return val ? [val] : []; }
}

function get(obj, ...keys) {
  for (const k of keys) { if (obj?.[k]) return obj[k]; }
  return "";
}

// ─── PEDAGOGICAL PROFILES ─────────────────────────────────────────────────
const PROFILES = {
  blocage_enonce: {
    id: "blocage_enonce",
    label: "Blocage sur l'énoncé / la consigne",
    explanation: "L'élève bloque principalement au moment de lire et comprendre ce qu'on lui demande. Il peut passer à côté de l'exercice non pas par manque de compétence, mais par difficulté à identifier la tâche à accomplir.",
    tags: ["lecture d'énoncé superficielle", "identification de la tâche fragile", "reformulation à travailler"],
    teacher_posture: "Guidée sur la lecture et l'identification de la tâche",
    correction_strategy: "Avant toute correction de contenu, vérifier que l'élève a compris ce qu'on lui demandait. Travailler la routine : je lis → je reformule → j'identifie données et objectif.",
    method: "Travailler la lecture en 3 étapes : ce qu'on cherche, ce qu'on sait, l'opération ou la démarche possible. Entraîner à l'identification des mots-clés et des verbes d'action dans l'énoncé.",
    avoid: [
      "Supposer que l'erreur vient toujours d'un manque de compétence",
      "Proposer des exercices sans vérification préalable de la compréhension de la consigne",
      "Utiliser des énoncés longs ou ambigus en début d'accompagnement",
    ],
    first_activity: "Présenter 3 énoncés courts. L'élève doit d'abord répondre : 'Qu'est-ce qu'on cherche ?' et 'Quelles informations on a ?' avant de commencer à résoudre.",
    activities: [
      "Reformulation systématique de la consigne avant chaque exercice",
      "Entraînement à l'identification des données et de l'objectif",
      "Exercices courts à énoncé simple puis progressivement plus complexe",
      "Lecture guidée : entourer les informations utiles, souligner la question",
    ],
    next_focus: "Installer la routine : lire → reformuler → identifier données → identifier objectif → choisir démarche.",
    four_week_plan: [
      { week: 1, title: "Installer la routine de lecture d'énoncé", objective: "L'élève peut identifier ce qu'on cherche et ce qu'on sait.", activities: "Énoncés courts, reformulation orale, identification des données.", monitor: "L'élève commence à calculer avant d'avoir compris.", mini_eval: "Reformuler 3 énoncés différents.", expected_progress: "L'élève pose la question 'qu'est-ce qu'on cherche ?' avant de commencer." },
      { week: 2, title: "Appliquer la routine sur des exercices variés", objective: "Transférer la méthode à des formats différents.", activities: "Exercices progressivement plus longs, même méthode de lecture.", monitor: "Régression sur les énoncés longs.", mini_eval: "Réussir un exercice à énoncé de 3 phrases.", expected_progress: "L'élève reformule spontanément sans y être invité." },
      { week: 3, title: "Travailler les erreurs de lecture fréquentes", objective: "Identifier et corriger les pièges courants.", activities: "Exercices avec données inutiles, questions ambiguës, formulations inhabituelles.", monitor: "Confusion entre données et objectif.", mini_eval: "Identifier le piège dans 2 exercices intentionnellement trompeurs.", expected_progress: "L'élève repère au moins un piège par séance." },
      { week: 4, title: "Consolider et réévaluer", objective: "Vérifier l'autonomie sur des exercices variés.", activities: "Mini-bilan : résoudre 3 exercices avec énoncés de complexité croissante.", monitor: "Retour au comportement de lecture rapide.", mini_eval: "L'élève peut expliquer sa démarche de lecture.", expected_progress: "Au moins 2 exercices sur 3 commencés avec la bonne méthode." },
    ],
  },

  comprend_exemple_bloque_seul: {
    id: "comprend_exemple_bloque_seul",
    label: "Comprend l'exemple mais bloque seul",
    explanation: "L'élève réussit quand un modèle est présent, mais perd pied dès que l'exercice est légèrement différent ou qu'il doit travailler sans aide immédiate. L'autonomie est encore fragile.",
    tags: ["autonomie fragile", "dépendance au modèle", "transfert à construire"],
    teacher_posture: "Progressive avec retrait graduel de l'aide",
    correction_strategy: "Variation progressive : commencer très proche du modèle, puis s'en éloigner progressivement. Ne pas corriger trop vite — laisser l'élève chercher.",
    method: "Utiliser des exemples guidés, puis demander à l'élève de modifier légèrement le modèle. Retirer progressivement l'aide. Travailler le 'pourquoi' de la méthode pour que l'élève puisse la généraliser.",
    avoid: [
      "Donner la solution ou un nouveau modèle dès que l'élève bloque",
      "Proposer des exercices trop différents du modèle sans transition",
      "Interpréter le succès sur le modèle comme une maîtrise complète",
    ],
    first_activity: "Résoudre un exercice ensemble, puis demander immédiatement à l'élève d'en résoudre un similaire seul. Comparer les deux démarches.",
    activities: [
      "Exercices en variation progressive : même méthode, contexte légèrement différent",
      "Verbalisation : l'élève explique ce qu'il a fait et pourquoi",
      "Retrait graduel : modèle complet → modèle partiel → pas de modèle",
      "Comparaison d'exemples pour identifier la méthode commune",
    ],
    next_focus: "Travailler la transition : 'comment passe-t-on du modèle à un exercice nouveau ?'",
    four_week_plan: [
      { week: 1, title: "Ancrer la méthode sur des exercices proches du modèle", objective: "L'élève réussit seul des exercices similaires au modèle travaillé.", activities: "Exercices guidés puis variation légère. Verbalisation.", monitor: "Besoin de modèle pour chaque exercice.", mini_eval: "Résoudre 3 exercices sans modèle visible.", expected_progress: "L'élève commence à chercher sans demander un nouveau modèle." },
      { week: 2, title: "Varier progressivement le contexte", objective: "L'élève transfère la méthode à des situations légèrement différentes.", activities: "Exercices avec variation de contexte, vérification de la démarche.", monitor: "Blocage dès que le contexte change.", mini_eval: "Réussir un exercice jamais vu avec la même méthode.", expected_progress: "L'élève reconnait 'c'est le même type de problème'." },
      { week: 3, title: "Construire l'autonomie sur des exercices variés", objective: "L'élève choisit seul la méthode et la applique.", activities: "Exercices mélangés sans indication de méthode.", monitor: "Retour à la dépendance au modèle.", mini_eval: "Identifier et appliquer la méthode adaptée sur 2 exercices inédits.", expected_progress: "L'élève fait moins d'allers-retours vers le modèle." },
      { week: 4, title: "Réévaluer et consolider", objective: "Vérifier l'autonomie réelle.", activities: "Mini-diagnostic : exercices variés sans aide.", monitor: "Régression sous pression.", mini_eval: "L'élève explique sa méthode.", expected_progress: "L'élève peut expliquer pourquoi sa méthode fonctionne." },
    ],
  },

  applique_sans_comprendre: {
    id: "applique_sans_comprendre",
    label: "Applique sans comprendre",
    explanation: "L'élève sait utiliser des formules ou des procédures, mais ne comprend pas le sens de ce qu'il fait. Les exercices standard réussissent, mais tout changement de contexte échoue.",
    tags: ["apprentissage procédural", "sens à construire", "formules sans ancrage"],
    teacher_posture: "Orientée sens et verbalisation",
    correction_strategy: "Avant de corriger une erreur, demander à l'élève d'expliquer ce qu'il a voulu faire. Travailler le 'pourquoi' avant le 'comment'.",
    method: "Relier chaque formule ou procédure à une situation concrète et à une phrase explicative. Demander systématiquement : 'Qu'est-ce que ça veut dire ?' Utiliser des schémas et des analogies.",
    avoid: [
      "Accepter un résultat correct sans demander l'explication",
      "Multiplier les exercices sans vérifier la compréhension",
      "Enseigner des formules sans exemple de situation réelle",
    ],
    first_activity: "Présenter une formule ou une procédure déjà connue. Demander : 'À quoi ça sert ? Dans quelle situation l'utilise-t-on ? Qu'est-ce que chaque élément représente ?'",
    activities: [
      "Relier formules et situations concrètes",
      "Verbalisation systématique : 'pourquoi j'utilise cette méthode ici'",
      "Schémas et représentations visuelles",
      "Comparaison d'exemples : trouver la différence de situation",
    ],
    next_focus: "Construire le sens avant l'automatisme. Commencer par 'pourquoi' avant 'comment'.",
    four_week_plan: [
      { week: 1, title: "Construire le sens des procédures maîtrisées", objective: "L'élève peut expliquer une procédure qu'il sait faire.", activities: "Pour chaque exercice réussi, demander une explication verbale.", monitor: "Résultats corrects sans capacité d'explication.", mini_eval: "Expliquer 2 méthodes en une phrase.", expected_progress: "L'élève commence à justifier ses réponses." },
      { week: 2, title: "Relier formules et situations", objective: "L'élève associe chaque formule à une situation type.", activities: "Carte formule → situation. Exercices avec contexte varié.", monitor: "Application automatique sans lire le contexte.", mini_eval: "Choisir la bonne méthode parmi 3 options avec justification.", expected_progress: "L'élève consulte le contexte avant de choisir sa méthode." },
      { week: 3, title: "Travailler le transfert par le sens", objective: "L'élève réussit des exercices dans des contextes nouveaux.", activities: "Exercices inhabituels, problèmes ouverts courts.", monitor: "Blocage face à l'inhabituel.", mini_eval: "Résoudre un exercice jamais vu avec une méthode connue.", expected_progress: "L'élève reconnaît une structure malgré un contexte différent." },
      { week: 4, title: "Réévaluer et consolider", objective: "Confirmer la compréhension profonde.", activities: "Mini-quiz avec justifications orales.", monitor: "Retour à l'application mécanique sous pression.", mini_eval: "Justifier 3 réponses.", expected_progress: "L'élève peut expliquer sa méthode sans aide." },
    ],
  },

  panique_face_erreur: {
    id: "panique_face_erreur",
    label: "Panique ou blocage face à l'erreur",
    explanation: "L'élève se bloque, s'auto-dévalorise ou abandonne face à une erreur. L'erreur est vécue comme un échec plutôt que comme une information utile. La confiance est à reconstruire avant de travailler sur les compétences.",
    tags: ["confiance basse", "gestion de l'erreur à travailler", "sécurité émotionnelle prioritaire"],
    teacher_posture: "Rassurante, sécurisante, centrée sur la démarche plutôt que le résultat",
    correction_strategy: "Correction guidée par questionnement : 'Qu'est-ce qui a bien marché ? Où as-tu hésité ? Que pourrais-tu essayer différemment ?' Ne jamais corriger sans valoriser ce qui est juste.",
    method: "Installer une culture de l'erreur positive : l'erreur est une information, pas un échec. Travailler avec des exercices courts où l'erreur est analysée plutôt que pénalisée. Proposer des micro-victoires régulières.",
    avoid: [
      "Corriger immédiatement et directement sans valoriser la démarche",
      "Proposer des exercices trop difficiles sans filet de sécurité",
      "Comparer avec d'autres élèves",
      "Mettre une note sur les exercices d'entraînement",
    ],
    first_activity: "Travailler sur une erreur passée connue. L'élève explique ce qu'il a fait, le professeur montre comment transformer l'erreur en apprentissage concret.",
    activities: [
      "Journal d'erreurs : noter les erreurs et ce qu'elles apprennent",
      "Exercices courts avec feedback immédiat positif",
      "Correction guidée par questions plutôt que par correction directe",
      "Mini-victoires : exercices courts délibérément accessibles",
    ],
    next_focus: "Installer la phrase clé : 'Cette erreur m'apprend que...' Valoriser la démarche avant le résultat.",
    four_week_plan: [
      { week: 1, title: "Installer une culture d'erreur positive", objective: "L'élève peut analyser une erreur sans panique.", activities: "Exercices courts, correction guidée, journal d'erreurs.", monitor: "Blocage, abandon, 'je suis nul'.", mini_eval: "Analyser une erreur et proposer une correction.", expected_progress: "L'élève tente de comprendre son erreur plutôt que d'abandonner." },
      { week: 2, title: "Pratiquer la correction guidée", objective: "L'élève sait comment chercher où l'erreur se trouve.", activities: "Exercices avec auto-correction guidée, questions de relance.", monitor: "Correction par copie sans compréhension.", mini_eval: "Localiser seul l'erreur dans un exercice.", expected_progress: "L'élève peut indiquer quelle étape a déraillé." },
      { week: 3, title: "Construire la persévérance", objective: "L'élève continue à chercher même après une première erreur.", activities: "Exercices en 2 étapes : tentative, analyse, nouvelle tentative.", monitor: "Abandon à la première difficulté.", mini_eval: "Compléter un exercice difficile en 2 essais.", expected_progress: "L'élève essaie au moins une deuxième fois avant de demander de l'aide." },
      { week: 4, title: "Consolider la confiance", objective: "L'élève voit ses progrès sur des exercices similaires à ceux du début.", activities: "Reprendre les exercices de la semaine 1. Comparer.", monitor: "Retour à la panique en situation de pression.", mini_eval: "Résoudre un exercice difficile de début.", expected_progress: "L'élève constate et verbalise ses propres progrès." },
    ],
  },

  manque_bases: {
    id: "manque_bases",
    label: "Bases à reconstruire",
    explanation: "Des prérequis essentiels sont fragiles ou absents. Les erreurs viennent moins d'un manque de méthode que d'un manque de fondations. Il faut cibler et reconstruire ces bases avant d'avancer.",
    tags: ["prérequis fragiles", "reconstruction ciblée", "consolidation avant progression"],
    teacher_posture: "Structurée et patiente, reconstruction ciblée",
    correction_strategy: "Identifier l'erreur de base derrière l'erreur visible. Corriger la cause, pas le symptôme.",
    method: "Identifier précisément les bases manquantes lors de la première séance. Ne pas couvrir l'ensemble du programme — travailler en profondeur les 2-3 bases les plus importantes. Exercices ciblés et répétés.",
    avoid: [
      "Avancer dans le programme sans avoir consolidé les bases",
      "Trop d'exercices en même temps sur trop de notions",
      "Ignorer les erreurs de base en se concentrant sur l'exercice du jour",
    ],
    first_activity: "Mini-diagnostic de prérequis : 3 à 5 exercices ciblant les bases présumées manquantes. Identifier les 1-2 lacunes prioritaires.",
    activities: [
      "Exercices ciblés sur les prérequis identifiés",
      "Routine de consolidation quotidienne courte (5-10 min)",
      "Retour régulier aux exercices maîtrisés pour maintenir",
      "Progression étape par étape avec vérification avant de passer à la suite",
    ],
    next_focus: "Identifier les 2-3 bases prioritaires et les reconstruire méthodiquement avant d'avancer.",
    four_week_plan: [
      { week: 1, title: "Identifier et cibler les bases manquantes", objective: "Connaître précisément les 2-3 lacunes prioritaires.", activities: "Mini-diagnostic, exercices ciblés sur lacunes identifiées.", monitor: "Erreurs récurrentes sur des prérequis essentiels.", mini_eval: "Réussir 3 exercices sur les bases prioritaires.", expected_progress: "L'élève progresse sur au moins une base ciblée." },
      { week: 2, title: "Consolider la première base", objective: "La base prioritaire est suffisamment stable pour aller plus loin.", activities: "Exercices variés sur la base prioritaire, application simple.", monitor: "Régression sur la base une fois le travail arrêté.", mini_eval: "Réussir 5 exercices sans aide sur la base prioritaire.", expected_progress: "L'élève gère la base prioritaire sans besoin de rappel systématique." },
      { week: 3, title: "Consolider la deuxième base et connecter", objective: "Les 2 bases travaillées fonctionnent ensemble.", activities: "Exercices combinant les 2 bases. Connexion au programme.", monitor: "Confusion entre les deux notions.", mini_eval: "Exercice combinant les 2 bases.", expected_progress: "L'élève distingue les deux contextes d'application." },
      { week: 4, title: "Appliquer au programme en cours", objective: "Les bases reconstituées permettent de travailler le programme.", activities: "Exercices du programme appuyés sur les bases reconstruites.", monitor: "Retour aux erreurs de base sous pression.", mini_eval: "Exercice de programme réussi grâce aux bases travaillées.", expected_progress: "L'élève fait le lien entre les bases et le programme." },
    ],
  },

  raisonnement_prometteur: {
    id: "raisonnement_prometteur",
    label: "Raisonnement prometteur mais mal structuré",
    explanation: "L'élève a de bonnes intuitions et un raisonnement réel, mais la démarche manque de structure. Les réponses sont incomplètes, les étapes sautées, la vérification absente.",
    tags: ["bonnes intuitions", "structuration à renforcer", "vérification absente"],
    teacher_posture: "Structurante — aider à formaliser ce qui est déjà là",
    correction_strategy: "Valoriser le raisonnement, puis travailler la structure. Demander : 'Comment arrives-tu à ce résultat ?' avant de corriger.",
    method: "Travailler l'explicitation des étapes et la vérification. Utiliser une checklist de résolution. Demander à l'élève de justifier chaque étape.",
    avoid: [
      "Accepter une bonne réponse sans demander la démarche",
      "Corriger uniquement le résultat final",
      "Ignorer les étapes manquantes si la réponse est correcte",
    ],
    first_activity: "L'élève résout un exercice, puis explique son raisonnement étape par étape. Le professeur aide à formaliser et compléter.",
    activities: [
      "Résolution expliquée à voix haute",
      "Checklist de vérification : ai-je compris la question ? Ai-je vérifié ?",
      "Exercices incomplets à compléter avec les étapes manquantes",
      "Problèmes ouverts où la démarche compte autant que le résultat",
    ],
    next_focus: "Travailler la structure de résolution : 1. comprendre 2. planifier 3. exécuter 4. vérifier 5. expliquer.",
    four_week_plan: [
      { week: 1, title: "Formaliser la démarche existante", objective: "L'élève explicite ses étapes de raisonnement.", activities: "Résolution commentée, comparaison de démarches.", monitor: "Sauts d'étapes, résultat sans justification.", mini_eval: "Expliquer la démarche complète sur un exercice.", expected_progress: "L'élève verbalise au moins 2 étapes de son raisonnement." },
      { week: 2, title: "Installer la vérification", objective: "L'élève vérifie systématiquement sa réponse.", activities: "Checklist de résolution, exercices avec vérification obligatoire.", monitor: "Résultat donné sans vérification.", mini_eval: "Vérifier 3 exercices avec justification.", expected_progress: "L'élève se pose la question 'est-ce que mon résultat a du sens ?'" },
      { week: 3, title: "Structurer sur des exercices complexes", objective: "La méthode s'applique sur des exercices plus exigeants.", activities: "Exercices à plusieurs étapes, rédaction de la démarche.", monitor: "Abandon de la structure sous pression.", mini_eval: "Résoudre un exercice en 4 étapes documentées.", expected_progress: "L'élève complète les exercices avec moins d'étapes manquantes." },
      { week: 4, title: "Autonomie et défi", objective: "L'élève structure seul des problèmes ouverts.", activities: "Problèmes ouverts, optimisation, justification.", monitor: "Retour aux raccourcis sous pression.", mini_eval: "Résoudre un problème ouvert avec démarche complète.", expected_progress: "L'élève produit une démarche lisible et complète." },
    ],
  },

  trop_dependant: {
    id: "trop_dependant",
    label: "Trop dépendant de la solution",
    explanation: "L'élève attend la correction ou la solution avant de vraiment chercher. L'autonomie est très faible. La dépendance à l'aide immédiate l'empêche de développer ses propres stratégies.",
    tags: ["autonomie très faible", "dépendance à la solution", "effort à construire"],
    teacher_posture: "Questions guidées plutôt que corrections directes",
    correction_strategy: "Ne jamais donner la solution directement. Utiliser des questions de relance. Donner des indices progressifs.",
    method: "Remplacer la correction directe par des questions : 'Qu'as-tu essayé ? Où bloques-tu précisément ? Qu'est-ce que tu sais déjà ?' Proposer des tâches courtes sans correction immédiate.",
    avoid: [
      "Donner la solution dès que l'élève bloque",
      "Trop de guidage : réduire progressivement l'aide",
      "Tolérer que l'élève copie un modèle sans essayer seul",
    ],
    first_activity: "Exercice court sans correction immédiate. L'élève remet sa réponse, le professeur pose des questions : 'Comment t'y es-tu pris ?' avant de corriger.",
    activities: [
      "Questions de relance progressives : indices du plus vague au plus précis",
      "Tâches courtes sans correction immédiate",
      "Séquence : essai seul → pair → professeur",
      "Valorisation de la recherche, pas du résultat",
    ],
    next_focus: "Travailler le droit à l'essai : une tentative, même imparfaite, vaut mieux qu'une attente.",
    four_week_plan: [
      { week: 1, title: "Installer le droit à l'essai", objective: "L'élève fait une tentative avant de demander de l'aide.", activities: "Exercices courts avec règle : essayer 5 minutes seul avant d'appeler.", monitor: "Demande d'aide immédiate.", mini_eval: "Compléter un exercice sans aide sur 5 minutes.", expected_progress: "L'élève tente seul avant de lever la main." },
      { week: 2, title: "Développer les stratégies de déblocage", objective: "L'élève sait quoi faire quand il bloque.", activities: "Liste de 3 stratégies : relire l'énoncé, décomposer, essayer un cas simple.", monitor: "Blocage sans stratégie.", mini_eval: "Utiliser une stratégie sans aide externe.", expected_progress: "L'élève utilise au moins une stratégie avant de demander de l'aide." },
      { week: 3, title: "Pratiquer l'autonomie progressive", objective: "L'élève complète des tâches variées avec moins d'aide.", activities: "Séquences guidé → semi-guidé → autonome.", monitor: "Retour à la dépendance sur de nouveaux exercices.", mini_eval: "Compléter 3 exercices sans aide.", expected_progress: "L'élève demande de l'aide après avoir cherché, pas avant." },
      { week: 4, title: "Évaluer l'autonomie", objective: "Constater les progrès sur l'autonomie.", activities: "Exercices similaires à ceux de début. Comparer.", monitor: "Régression en situation d'évaluation.", mini_eval: "Résoudre un exercice complet seul.", expected_progress: "L'élève voit sa propre progression en autonomie." },
    ],
  },

  besoin_concret: {
    id: "besoin_concret",
    label: "Besoin de concret et de contexte",
    explanation: "L'élève comprend mieux quand les notions sont ancrées dans des situations concrètes. L'abstraction pure bloque, mais des exemples de la vraie vie débloquent rapidement.",
    tags: ["apprentissage contextuel", "abstraction à construire", "exemples concrets efficaces"],
    teacher_posture: "Ancrée dans le concret — abstraire progressivement",
    correction_strategy: "Montrer l'utilité concrète de ce qui est corrigé. Relier chaque erreur à une situation où elle poserait problème.",
    method: "Partir systématiquement d'une situation concrète ou d'un projet avant d'abstraire. Utiliser des analogies et des visualisations. Construire l'abstraction à partir du concret, pas l'inverse.",
    avoid: [
      "Partir des définitions abstraites avant les exemples",
      "Exercices hors contexte en début d'apprentissage",
      "Insister sur la théorie avant d'avoir ancré dans une situation",
    ],
    first_activity: "Présenter une situation concrète du quotidien ou liée aux intérêts de l'élève. Résoudre ensemble, puis abstraire la méthode.",
    activities: [
      "Mini-projets appliqués",
      "Situations réelles comme point de départ",
      "Analogies et visualisations",
      "Exercices puis abstraction (pas l'inverse)",
    ],
    next_focus: "Trouver le contexte concret qui débloque pour cet élève. Partir de là à chaque nouvelle notion.",
    four_week_plan: [
      { week: 1, title: "Ancrer dans des situations concrètes", objective: "Comprendre la notion via une situation réelle.", activities: "Situations de la vie quotidienne ou d'intérêt personnel. Application directe.", monitor: "Blocage face à la formalisation.", mini_eval: "Résoudre un problème concret similaire.", expected_progress: "L'élève fait le lien entre la situation et la notion." },
      { week: 2, title: "Abstraire progressivement", objective: "Partir du concret vers la formulation plus générale.", activities: "Comparer 2 situations concrètes pour en extraire la règle.", monitor: "Perte de lien dès que le contexte disparaît.", mini_eval: "Expliquer la règle en une phrase.", expected_progress: "L'élève peut formuler une règle à partir de 2 exemples." },
      { week: 3, title: "Appliquer dans des contextes variés", objective: "Transférer la notion à des contextes différents.", activities: "Exercices variés avec contexte différent mais même méthode.", monitor: "Blocage dès que le contexte est inhabituel.", mini_eval: "Résoudre dans un contexte nouveau.", expected_progress: "L'élève reconnait la méthode dans un contexte différent." },
      { week: 4, title: "Mini-projet ou défi appliqué", objective: "Utiliser les notions dans un mini-projet.", activities: "Projet court mêlant les notions de la période.", monitor: "Difficulté à mobiliser les notions hors contexte guidé.", mini_eval: "Compléter un mini-projet ou défi.", expected_progress: "L'élève utilise les notions dans un projet personnel." },
    ],
  },

  profil_autonome: {
    id: "profil_autonome",
    label: "Profil autonome à challenger",
    explanation: "L'élève comprend rapidement, peut expliquer, corrige ses erreurs et cherche par lui-même. Il a besoin de défis et de complexité pour progresser réellement.",
    tags: ["autonomie élevée", "besoin de défi", "profondeur à explorer"],
    teacher_posture: "Exigeante et challengeante — problèmes ouverts et justifications",
    correction_strategy: "Correction par approfondissement : pourquoi ? Peut-on faire autrement ? Peut-on généraliser ?",
    method: "Proposer des problèmes ouverts, des questions de type 'est-ce toujours vrai ?', des challenges d'optimisation. Travailler la rigueur de la démarche et la justification formelle.",
    avoid: [
      "Proposer des exercices trop simples ou répétitifs",
      "Laisser l'élève sans défi sous prétexte qu'il 'y arrive'",
      "Négliger la rigueur de la démarche parce que les résultats sont corrects",
    ],
    first_activity: "Problème ouvert ou question 'est-ce toujours vrai ?' sur une notion déjà maîtrisée. Demander une justification complète.",
    activities: [
      "Problèmes ouverts et d'optimisation",
      "Questions de généralisation : 'et si... ?'",
      "Projets autonomes",
      "Enseignement par les pairs : expliquer à quelqu'un",
    ],
    next_focus: "Travailler la rigueur et la profondeur plutôt que la vitesse. Challenges réguliers.",
    four_week_plan: [
      { week: 1, title: "Évaluer la profondeur réelle de compréhension", objective: "Confirmer la maîtrise et identifier les zones moins solides.", activities: "Problèmes ouverts, questions de justification.", monitor: "Résultats corrects sans démarche formelle.", mini_eval: "Justifier complètement une solution.", expected_progress: "L'élève produit des justifications structurées." },
      { week: 2, title: "Travailler la généralisation", objective: "L'élève peut généraliser une méthode à des cas variés.", activities: "Exploration de cas particuliers et généraux.", monitor: "Généralisation trop rapide sans vérification.", mini_eval: "Trouver un contre-exemple ou une limite.", expected_progress: "L'élève reconnaît les limites d'une méthode." },
      { week: 3, title: "Challenge et projet", objective: "L'élève travaille de manière autonome sur un défi.", activities: "Mini-projet ou problème complexe à plusieurs étapes.", monitor: "Découragement face à la complexité.", mini_eval: "Rendre un travail complet avec justification.", expected_progress: "L'élève produit un travail de qualité de manière autonome." },
      { week: 4, title: "Partager et expliquer", objective: "L'élève peut expliquer ses méthodes à quelqu'un d'autre.", activities: "Explication d'une méthode, production d'un guide court.", monitor: "Difficulté à vulgariser.", mini_eval: "Expliquer une méthode à un pair ou au professeur.", expected_progress: "L'élève peut transmettre ce qu'il sait." },
    ],
  },

  profil_a_confirmer: {
    id: "profil_a_confirmer",
    label: "Profil à confirmer",
    explanation: "Les données disponibles ne permettent pas encore de déterminer un profil pédagogique précis. Une première séance d'observation est indispensable avant de fixer un plan.",
    tags: ["données insuffisantes", "première séance d'observation recommandée"],
    teacher_posture: "Observation active — reporter les décisions pédagogiques après la première séance",
    correction_strategy: "À définir après observation.",
    method: "Commencer par une séance d'observation variée. Proposer des tâches différentes pour révéler le mode de fonctionnement réel.",
    avoid: [
      "Construire un plan rigide sans données suffisantes",
      "Supposer le profil sans observation directe",
    ],
    first_activity: "3 tâches courtes et variées pour observer : compréhension d'un énoncé, calcul ou code simple, réaction à une erreur.",
    activities: [
      "Tâches d'observation variées",
      "Mini-diagnostic complémentaire en séance",
      "Questions ouvertes pour comprendre la méthode de travail",
    ],
    next_focus: "Observer la réaction à l'erreur, le niveau d'autonomie et la méthode de démarrage lors de la première séance.",
    four_week_plan: [
      { week: 1, title: "Observation et mini-diagnostic", objective: "Identifier le profil et les priorités.", activities: "Séance d'observation, tâches variées, mini-diagnostic.", monitor: "Tout.", mini_eval: "Identifier le profil principal.", expected_progress: "Profil identifié et plan semaine 2 défini." },
      { week: 2, title: "Plan à définir après semaine 1", objective: "À compléter selon les observations.", activities: "À définir.", monitor: "À définir.", mini_eval: "À définir.", expected_progress: "À définir." },
      { week: 3, title: "Consolidation", objective: "À compléter.", activities: "À définir.", monitor: "À définir.", mini_eval: "À définir.", expected_progress: "À définir." },
      { week: 4, title: "Réévaluation", objective: "Bilan à 4 semaines.", activities: "Mini-bilan.", monitor: "À définir.", mini_eval: "À définir.", expected_progress: "À définir." },
    ],
  },
};

// ─── PROFILE DETECTION ────────────────────────────────────────────────────
function detectProfile(bySection, domain, profile_type) {
  const goal = bySection.common_goal || {};
  const block = bySection.common_blocage || {};
  const error = bySection.common_error || {};
  const method = bySection.common_method || {};
  const math = bySection.math_profile || {};
  const cs = bySection.cs_profile || {};
  const obs = bySection.teacher_observation || {};

  const blockAnswer = get(block, "block_01");
  const errorAnswer = get(error, "err_01");
  const methodAnswer = get(method, "meth_02");
  const obsReasoning = get(obs, "obs_03");
  const obsBlockage = get(obs, "obs_01");
  const obsErrorReaction = get(obs, "obs_02");

  const scores = {
    blocage_enonce: 0,
    comprend_exemple_bloque_seul: 0,
    applique_sans_comprendre: 0,
    panique_face_erreur: 0,
    manque_bases: 0,
    raisonnement_prometteur: 0,
    trop_dependant: 0,
    besoin_concret: 0,
    profil_autonome: 0,
  };

  // Block signals
  if (blockAnswer.includes("comprendre la consigne") || blockAnswer.includes("commencer")) scores.blocage_enonce += 3;
  if (blockAnswer.includes("choisir une méthode")) scores.comprend_exemple_bloque_seul += 2;
  if (blockAnswer.includes("choisir une méthode")) scores.applique_sans_comprendre += 1;
  if (blockAnswer.includes("erreur")) scores.panique_face_erreur += 2;
  if (blockAnswer.includes("expliquer")) scores.raisonnement_prometteur += 2;
  if (blockAnswer.includes("travailler seul")) scores.trop_dependant += 3;

  // Error reaction signals
  if (errorAnswer.includes("bloque") || errorAnswer.includes("nul")) scores.panique_face_erreur += 4;
  if (errorAnswer.includes("passe à autre chose")) scores.panique_face_erreur += 2;
  if (errorAnswer.includes("recommence depuis le début")) scores.manque_bases += 1;
  if (errorAnswer.includes("demande de l'aide")) scores.trop_dependant += 2;
  if (errorAnswer.includes("change de méthode au hasard")) scores.manque_bases += 2;
  if (errorAnswer.includes("comprendre d'où elle vient")) scores.raisonnement_prometteur += 3;
  if (errorAnswer.includes("comprendre d'où elle vient")) scores.profil_autonome += 2;

  // Method signals
  if (methodAnswer === "Je peux refaire mais pas expliquer") { scores.applique_sans_comprendre += 4; }
  if (methodAnswer === "Rarement" || methodAnswer === "Non") { scores.applique_sans_comprendre += 2; }
  if (methodAnswer === "Oui, souvent") { scores.profil_autonome += 3; scores.raisonnement_prometteur += 1; }

  // Math-specific
  if (domain === "mathematics" || domain === "mixed") {
    const math2 = get(math, "math_02");
    const math3 = get(math, "math_03");
    if (math2.includes("cherche directement les nombres")) scores.blocage_enonce += 3;
    if (math2.includes("ne sais pas par où commencer") || math2.includes("bloque")) { scores.blocage_enonce += 2; scores.manque_bases += 1; }
    if (math3 === "Quelque chose à apprendre par cœur") scores.applique_sans_comprendre += 3;
    if (math3 === "Ce qui me bloque le plus") scores.manque_bases += 2;
  }

  // CS-specific
  if (domain === "computer_science" || domain === "mixed") {
    const cs2 = get(cs, "cs_02");
    const cs3 = get(cs, "cs_03");
    if (cs2.includes("change des choses au hasard")) { scores.manque_bases += 2; scores.panique_face_erreur += 1; }
    if (cs2.includes("demande directement la solution")) scores.trop_dependant += 3;
    if (cs2.includes("recommence tout")) { scores.manque_bases += 1; scores.trop_dependant += 1; }
    if (cs2.includes("lis le message d'erreur") || cs2.includes("print")) scores.profil_autonome += 2;
    if (cs3.includes("comprendre le problème") || cs3.includes("découper")) scores.blocage_enonce += 2;
  }

  // Teacher observation
  if (obsBlockage) {
    if (obsBlockage.includes("Compréhension d'énoncé")) scores.blocage_enonce += 3;
    if (obsBlockage.includes("Manque de confiance")) scores.panique_face_erreur += 3;
    if (obsBlockage.includes("Application mécanique")) scores.applique_sans_comprendre += 3;
    if (obsBlockage.includes("Bases fragiles")) scores.manque_bases += 4;
    if (obsBlockage.includes("Méthode absente")) { scores.comprend_exemple_bloque_seul += 2; scores.manque_bases += 1; }
    if (obsBlockage.includes("Autonomie faible")) scores.trop_dependant += 3;
  }
  if (obsReasoning) {
    if (obsReasoning.includes("Applique sans comprendre")) scores.applique_sans_comprendre += 4;
    if (obsReasoning.includes("Attend la procédure")) scores.trop_dependant += 3;
    if (obsReasoning.includes("prometteur")) scores.raisonnement_prometteur += 3;
    if (obsReasoning.includes("Teste plusieurs pistes")) scores.profil_autonome += 3;
  }
  if (obsErrorReaction) {
    if (obsErrorReaction.includes("Panique") || obsErrorReaction.includes("Abandonne")) scores.panique_face_erreur += 4;
    if (obsErrorReaction.includes("Attend la solution")) scores.trop_dependant += 3;
    if (obsErrorReaction.includes("Analyse l'erreur")) { scores.profil_autonome += 2; scores.raisonnement_prometteur += 2; }
  }

  // Find highest score
  let best = "profil_a_confirmer";
  let bestScore = 0;
  for (const [k, v] of Object.entries(scores)) {
    if (v > bestScore) { bestScore = v; best = k; }
  }

  // Secondary tags
  const secondary = Object.entries(scores)
    .filter(([k, v]) => v >= 2 && k !== best)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => PROFILES[k]?.label || k);

  return { main: best, secondary, allScores: scores };
}

// ─── DOMAIN-SPECIFIC TAGS ─────────────────────────────────────────────────
function getDomainTags(bySection, domain, profileId) {
  const tags = [];
  const math = bySection.math_profile || {};
  const cs = bySection.cs_profile || {};

  if (domain === "mathematics" || domain === "mixed") {
    const math2 = get(math, "math_02");
    const math3 = get(math, "math_03");
    const math5 = get(math, "math_05");
    const math4 = get(math, "math_04");
    if (math2.includes("cherche directement les nombres")) tags.push({ tag: "Lecture d'énoncé superficielle", rec: "Travailler la lecture en 3 étapes : ce qu'on cherche, ce qu'on sait, l'opération possible." });
    if (math3 === "Quelque chose à apprendre par cœur") tags.push({ tag: "Formules sans sens stabilisé", rec: "Relier chaque formule à une situation et à une phrase explicative." });
    if (math5.includes("calcul mais pas expliquer") || math5.includes("juste le résultat")) tags.push({ tag: "Rédaction mathématique fragile", rec: "Travailler des phrases de justification courtes : je cherche…, je sais que…, donc…" });
    if (math4.includes("erreurs d'inattention")) tags.push({ tag: "Erreurs de calcul par inattention", rec: "Installer une routine de vérification en 2 étapes à la fin de chaque exercice." });
    if (math4.includes("quelle opération choisir")) tags.push({ tag: "Confusion méthode / résultat", rec: "Travailler l'identification du type d'exercice avant de calculer." });
  }

  if (domain === "computer_science" || domain === "mixed") {
    const cs2 = get(cs, "cs_02");
    const cs3 = get(cs, "cs_03");
    const cs5 = get(cs, "cs_05");
    if (cs2.includes("change des choses au hasard")) tags.push({ tag: "Debugging non structuré", rec: "Installer une routine : lire l'erreur → isoler la ligne → formuler une hypothèse → tester une modification." });
    if (cs3.includes("découper")) tags.push({ tag: "Décomposition du problème fragile", rec: "Avant le code, écrire les étapes en langage naturel ou pseudo-code." });
    if (cs3.includes("comprendre le problème")) tags.push({ tag: "Transfert fragile", rec: "Modifier un exemple existant puis créer une variation proche." });
    if (cs5.includes("exemple complet") || cs5.includes("modifier un exemple")) tags.push({ tag: "Projet motivant recommandé", rec: "Construire un mini-projet personnel pour ancrer les notions." });
  }

  return tags;
}

// ─── SKILL ESTIMATE (cautious) ────────────────────────────────────────────
function buildSkillEstimate(bySection, domain, hasMiniTasks) {
  if (!hasMiniTasks) {
    return {
      available: false,
      label: "À confirmer",
      note: "Les mini-tâches n'ont pas été complétées. Le niveau de compétence est à confirmer lors de la première séance.",
      dimensions: [],
    };
  }

  const mathMini = bySection.math_mini_tasks || {};
  const csMini = bySection.cs_mini_tasks || {};
  const obs = bySection.teacher_observation || {};

  const dims = [];

  if (domain === "mathematics" || domain === "mixed") {
    const mt1 = get(mathMini, "mt_math_01");
    const mt2 = get(mathMini, "mt_math_02");
    const mt3 = get(mathMini, "mt_math_03");
    const mt4 = get(mathMini, "mt_math_04");
    const mt5 = get(mathMini, "mt_math_05");

    const comprChoix = mt1 === "3 × 4" ? "solide" : mt1 ? "fragile" : "non évalué";
    const methodChoix = mt2 === "Multiplier 8 par 5" ? "solide" : mt2 ? "fragile" : "non évalué";
    const verification = mt3.includes("trop petit") ? "présente" : mt3 ? "absente ou fragile" : "non évaluée";
    const sensFormule = mt4 === "Organiser une relation entre des éléments" ? "ancré" : mt4 ? "à consolider" : "non évalué";
    const redaction = mt5 ? (mt5.length > 20 ? "présente" : "minimale") : "non évaluée";

    dims.push({ label: "Compréhension de l'opération", value: comprChoix });
    dims.push({ label: "Choix de méthode", value: methodChoix });
    dims.push({ label: "Vérification du résultat", value: verification });
    dims.push({ label: "Sens des formules", value: sensFormule });
    dims.push({ label: "Rédaction / explication", value: redaction });
  }

  if (domain === "computer_science" || domain === "mixed") {
    const cs1 = get(csMini, "mt_cs_01");
    const cs2 = get(csMini, "mt_cs_02");
    const cs3 = get(csMini, "mt_cs_03");
    const cs4 = get(csMini, "mt_cs_04");
    const cs5 = get(csMini, "mt_cs_05");

    dims.push({ label: "Logique conditionnelle", value: cs1 === "age >= 18" ? "solide" : cs1 ? "fragile" : "non évaluée" });
    dims.push({ label: "Compréhension des boucles", value: cs2 === "Répéter une action" ? "solide" : cs2 ? "fragile" : "non évaluée" });
    dims.push({ label: "Lecture et debugging", value: cs3 === "Division par zéro" ? "solide" : cs3 ? "fragile" : "non évaluée" });
    dims.push({ label: "Décomposition du problème", value: cs4.includes("petites étapes") ? "bien orienté" : cs4 ? "à travailler" : "non évaluée" });
    dims.push({ label: "Compréhension des variables", value: cs5 ? (cs5.length > 15 ? "présente" : "minimale") : "non évaluée" });
  }

  // Teacher guiding level
  const guidage = get(obs, "obs_04");
  if (guidage) dims.push({ label: "Niveau de guidage observé", value: guidage });

  return { available: true, label: "Estimé", note: "Basé sur les mini-tâches et l'observation. À confirmer en séance.", dimensions: dims };
}

// ─── RELIABILITY ──────────────────────────────────────────────────────────
function computeReliability(bySection, diagnostic) {
  let score = 25;
  const sections = Object.keys(bySection);

  if (sections.includes("common_goal")) score += 10;
  if (sections.includes("common_blocage")) score += 10;
  if (sections.includes("common_error")) score += 5;
  if (sections.includes("common_method")) score += 5;
  if (sections.includes("teacher_observation")) score += 20;
  if (sections.includes("parent_context")) score += 5;
  if (sections.includes("math_mini_tasks") || sections.includes("cs_mini_tasks")) score += 15;
  if (sections.includes("math_profile") || sections.includes("cs_profile")) score += 5;

  if (diagnostic?.learner_profile_type === "child" && !sections.includes("teacher_observation")) score -= 15;
  if (diagnostic?.diagnostic_mode === "express") score -= 10;
  if (diagnostic?.diagnostic_mode === "complete") score += 5;
  if (diagnostic?.teacher_validated) score += 5;

  score = Math.max(10, Math.min(100, score));

  let label;
  if (score >= 80) label = "Synthèse solide";
  else if (score >= 60) label = "Synthèse assez fiable";
  else if (score >= 40) label = "Synthèse partielle";
  else label = "À confirmer";

  return { score, label, raw_label: score >= 80 ? "fiable" : score >= 60 ? "assez_fiable" : score >= 40 ? "partiel" : "a_confirmer" };
}

// ─── MISSING DATA ANALYSIS ─────────────────────────────────────────────────
function buildMissingEvidence(bySection, domain, diagnostic) {
  const missing = [];
  const sections = Object.keys(bySection);
  if (!sections.includes("teacher_observation")) missing.push("Observation professeur — fiabilité maximale : assez fiable sans cette partie");
  if (!sections.includes("math_mini_tasks") && !sections.includes("cs_mini_tasks")) missing.push("Mini-tâches — le niveau de compétence est à confirmer en séance");
  if (diagnostic?.includes_parent_section && !sections.includes("parent_context")) missing.push("Partie parent — le contexte familial peut être incomplet");
  return missing;
}

// ─── FIRST LESSON ANGLE ───────────────────────────────────────────────────
function buildFirstLessonAngle(profileId, domain, blockAnswer, goalAnswer) {
  const ANGLES_MATH = {
    blocage_enonce: "Commencer par lire et reformuler 3 énoncés courts. L'élève doit répondre 'qu'est-ce qu'on cherche ?' avant tout calcul.",
    comprend_exemple_bloque_seul: "Résoudre un exercice ensemble, puis demander à l'élève d'en résoudre un similaire seul immédiatement.",
    applique_sans_comprendre: "Prendre une formule connue de l'élève. Lui demander : 'À quoi sert-elle ? Dans quelle situation ?' avant tout exercice.",
    panique_face_erreur: "Travailler une erreur passée connue. L'analyser ensemble comme une information, pas comme un échec.",
    manque_bases: "Mini-diagnostic de prérequis : 3-5 exercices ciblant les bases présumées fragiles.",
    raisonnement_prometteur: "L'élève résout un exercice, puis explique sa démarche. Formaliser ensemble ce qui est déjà là.",
    trop_dependant: "Exercice court, règle : 5 minutes de recherche seul avant toute aide.",
    besoin_concret: "Partir d'une situation concrète liée à la vraie vie. Résoudre ensemble, puis abstraire.",
    profil_autonome: "Problème ouvert avec justification complète demandée.",
    profil_a_confirmer: "3 tâches courtes et variées pour observer : énoncé, calcul, réaction à l'erreur.",
  };
  const ANGLES_CS = {
    blocage_enonce: "Donner un exercice de code avec énoncé. L'élève doit d'abord écrire 'ce que le programme doit faire' en langage naturel avant d'écrire du code.",
    comprend_exemple_bloque_seul: "Modifier un code existant plutôt qu'écrire from scratch. Comprendre le code, puis le modifier, puis créer une variation.",
    applique_sans_comprendre: "Prendre du code existant. Demander : 'Que fait chaque ligne ? Pourquoi ?' avant tout exercice.",
    panique_face_erreur: "Prendre un code avec une erreur connue. Analyser ensemble le message d'erreur comme une information.",
    manque_bases: "Mini-diagnostic : variables, condition simple, boucle simple. Identifier les bases fragiles.",
    raisonnement_prometteur: "L'élève explique son code existant ligne par ligne. Formaliser la logique.",
    trop_dependant: "Exercice court sans accès immédiat à la solution. Recherche seul 10 minutes.",
    besoin_concret: "Projet minimal : 'écrire un programme qui fait quelque chose d'utile'. Partir du projet, abstraire les notions.",
    profil_autonome: "Problème algorithmique avec plusieurs solutions possibles. Justifier le choix.",
    profil_a_confirmer: "3 tâches variées : lire du code, écrire une condition, debugger une erreur simple.",
  };
  const angles = domain === "computer_science" ? ANGLES_CS : ANGLES_MATH;
  return angles[profileId] || "Commencer par observer comment l'élève aborde un exercice inconnu.";
}

// ─── ERROR WATCHLIST ──────────────────────────────────────────────────────
function buildErrorWatchlist(profileId, domain, bySection) {
  const watchlist = [];
  const obs = bySection.teacher_observation || {};
  const teacherItems = tryParseArray(get(obs, "obs_07") || "");

  for (const item of teacherItems.slice(0, 3)) {
    watchlist.push({
      name: item,
      type: "observation professeur",
      why: "Identifié par le professeur lors de l'observation.",
      how_to_note: "Notez uniquement les erreurs répétées, pas les erreurs isolées.",
      when_review: "Semaine 1-2",
    });
  }

  const MATH_WATCHLIST = {
    blocage_enonce: [{ name: "Lecture trop rapide de l'énoncé", type: "méthode", why: "L'élève commence à calculer avant d'avoir compris ce qu'on lui demande.", how_to_note: "Observez si l'élève relève la tête avant de poser le crayon.", when_review: "Dès la première séance" }],
    applique_sans_comprendre: [{ name: "Formule utilisée sans sens", type: "concept", why: "L'élève applique une formule sans savoir pourquoi.", how_to_note: "Demandez 'pourquoi tu utilises cette formule ?' après chaque réponse.", when_review: "Semaine 1" }],
    panique_face_erreur: [{ name: "Auto-dévalorisation à l'erreur", type: "confiance", why: "L'élève dit 'je suis nul' ou s'arrête complètement.", how_to_note: "Notez la réaction immédiate à la première erreur.", when_review: "Dès la première séance" }],
    manque_bases: [{ name: "Erreur de calcul répétée", type: "calcul", why: "Base fragile générant des erreurs en cascade.", how_to_note: "Notez les opérations systématiquement ratées.", when_review: "Semaine 1" }],
  };

  const CS_WATCHLIST = {
    blocage_enonce: [{ name: "Code écrit sans plan", type: "méthode", why: "L'élève code sans avoir compris ce que le programme doit faire.", how_to_note: "Observez si l'élève écrit du code dans les 30 premières secondes.", when_review: "Dès la première séance" }],
    manque_bases: [{ name: "Debugging au hasard", type: "méthode", why: "L'élève change des choses sans hypothèse.", how_to_note: "Observez si l'élève lit le message d'erreur avant de modifier.", when_review: "Dès la première séance" }],
    panique_face_erreur: [{ name: "Blocage sur les messages d'erreur", type: "confiance", why: "L'élève interprète l'erreur comme un échec et pas une information.", how_to_note: "Notez la première réaction quand un message d'erreur apparaît.", when_review: "Dès la première séance" }],
  };

  const domainList = domain === "computer_science" ? CS_WATCHLIST : MATH_WATCHLIST;
  const profileItems = domainList[profileId] || [];
  for (const item of profileItems) {
    if (!watchlist.find(w => w.name === item.name)) watchlist.push(item);
  }

  // Common
  watchlist.push({ name: "Absence de vérification", type: "méthode", why: "L'élève ne vérifie pas si son résultat a du sens.", how_to_note: "Observez si l'élève relit sa réponse avant de la rendre.", when_review: "Semaine 2" });

  return watchlist.slice(0, 6);
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────
export function calculateDiagnosticResult(responses, diagnostic, learner) {
  const bySection = parseResponses(responses);
  const domain = diagnostic?.domain || "mathematics";
  const profileType = diagnostic?.learner_profile_type || "adult";
  const name = learner?.display_name || learner?.first_name || "L'élève";

  const hasMiniTasks = responses.some(r => r.section_key?.includes("mini_tasks"));
  const hasTeacherObs = responses.some(r => r.section_key === "teacher_observation");

  // Profile detection
  const { main: profileId, secondary } = detectProfile(bySection, domain, profileType);
  const profileData = PROFILES[profileId] || PROFILES.profil_a_confirmer;

  // Domain-specific tags
  const domainTags = getDomainTags(bySection, domain, profileId);

  // Skill estimate
  const skillEstimate = buildSkillEstimate(bySection, domain, hasMiniTasks);

  // Reliability
  const reliability = computeReliability(bySection, diagnostic);

  // Missing evidence
  const missingEvidence = buildMissingEvidence(bySection, domain, diagnostic);

  // Context extraction
  const goalSec = bySection.common_goal || {};
  const blockSec = bySection.common_blocage || {};
  const errorSec = bySection.common_error || {};
  const parentSec = bySection.parent_context || {};
  const obsSec = bySection.teacher_observation || {};

  const primaryGoal = get(goalSec, "goal_01", "goal_02", "goal_03", "goal_04", "goal_05");
  const successText = get(goalSec, "goal_06", "goal_07");
  const mainBlock = get(blockSec, "block_01", "block_02");
  const errorReaction = get(errorSec, "err_01", "err_02");
  const parentObs = get(parentSec, "par_02", "par_01");
  const parentGoal = get(parentSec, "par_03");
  const teacherPosture = get(obsSec, "obs_05");
  const teacherFirstLesson = get(obsSec, "obs_06");
  const guidageLevel = get(obsSec, "obs_04");

  // First lesson angle
  const firstLessonAngle = teacherFirstLesson || buildFirstLessonAngle(profileId, domain, mainBlock, primaryGoal);

  // Error watchlist
  const errorWatchlist = buildErrorWatchlist(profileId, domain, bySection);

  // Global summary
  const domainLabel = domain === "computer_science" ? "informatique" : domain === "mixed" ? "maths et informatique" : "mathématiques";
  let globalSummary = `${name} présente un profil "${profileData.label}" en ${domainLabel}. ${profileData.explanation.split(".")[0]}. `;
  if (primaryGoal) globalSummary += `Objectif déclaré : ${primaryGoal.toLowerCase()}. `;
  if (mainBlock) globalSummary += `Blocage principal : ${mainBlock.toLowerCase()}. `;
  globalSummary += `Première action recommandée : ${profileData.next_focus}`;

  // Confidence & autonomy from observation
  const confMap = { "Très guidé": 20, "Guidé avec exemples": 35, "Semi-autonome": 55, "Autonome avec vérification": 70, "Autonome": 90, "À confirmer": 50 };
  const autonomyScore = confMap[guidageLevel] || 50;
  const panicSignals = errorReaction.includes("bloque") || errorReaction.includes("nul") || get(obsSec, "obs_02").includes("Panique");
  const confidenceScore = panicSignals ? 25 : (errorReaction.includes("comprendre") ? 75 : 50);

  return {
    // Identity
    domain,
    main_profile_type: profileId,
    profile_label: profileData.label,
    profile_explanation: profileData.explanation,
    secondary_profile_tags: [...secondary, ...domainTags.map(t => t.tag)].slice(0, 4),
    global_profile_summary: globalSummary,

    // Context
    learner_personal_goal_text: primaryGoal,
    main_blockage_text: mainBlock,
    success_indicator_text: successText,
    parent_support_notes: parentObs || parentGoal,
    error_reaction: errorReaction,

    // Method
    recommended_method_text: profileData.method,
    avoid_list: profileData.avoid,
    recommended_activities: profileData.activities,
    teacher_posture: teacherPosture || profileData.teacher_posture,
    correction_strategy: profileData.correction_strategy,
    recommended_first_activity: profileData.first_activity,
    first_lesson_angle_text: firstLessonAngle,
    next_session_focus_text: profileData.next_focus,

    // Domain tags with recommendations
    domain_tags: domainTags,

    // Plan & watchlist
    four_week_plan: profileData.four_week_plan,
    error_watchlist: errorWatchlist,
    priority_areas: buildPriorities(profileId, profileData, mainBlock, primaryGoal, domain),

    // Skill estimate (cautious)
    skill_estimate: skillEstimate,
    skill_estimate_dimensions: skillEstimate.dimensions,
    skill_estimate_note: skillEstimate.note,
    skill_estimate_available: skillEstimate.available,

    // Reliability
    reliability_score: reliability.score,
    reliability_label: reliability.raw_label,
    reliability_display_label: reliability.label,
    missing_evidence: missingEvidence,
    has_teacher_observation: hasTeacherObs,
    has_mini_tasks: hasMiniTasks,

    // Scores
    autonomy_score: autonomyScore,
    confidence_score: confidenceScore,

    // For report generator
    engagement_levers: [primaryGoal || "À préciser"].filter(Boolean),
    preferred_themes: [],
    motivation_profile: primaryGoal || mainBlock || "non défini",
    goal_clarity_score: primaryGoal ? 60 : 20,
  };
}

function buildPriorities(profileId, profileData, mainBlock, goal, domain) {
  const priorities = [];

  priorities.push({
    title: profileData.label,
    reason: profileData.explanation.split(".")[0],
    actions: profileData.activities.slice(0, 3),
    indicator: profileData.next_focus,
  });

  if (mainBlock && !mainBlock.includes("ne sais pas")) {
    priorities.push({
      title: `Débloquer : ${mainBlock.toLowerCase()}`,
      reason: "Blocage identifié par l'élève lui-même.",
      actions: [profileData.first_activity],
      indicator: "L'élève gère ce type de blocage avec moins d'aide.",
    });
  }

  if (domain === "computer_science" && mainBlock.includes("erreur")) {
    priorities.push({
      title: "Installer une routine de debugging",
      reason: "L'élève réagit aux erreurs sans stratégie structurée.",
      actions: ["Lire le message d'erreur", "Isoler la ligne problématique", "Formuler une hypothèse", "Tester une modification"],
      indicator: "L'élève lit systématiquement le message d'erreur avant de modifier.",
    });
  }

  return priorities.slice(0, 3);
}