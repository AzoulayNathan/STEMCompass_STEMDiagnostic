# STEM Compass

Outil pédagogique STEM (mathématiques et informatique) pour professeurs et tuteurs : diagnostic multi-répondants, mini-tâches, scoring et rapports adaptés à chaque élève.

**NA Studio** — Nathan Azoulay

## Stack

- React + Vite + Tailwind CSS
- Supabase (Auth + PostgreSQL)
- shadcn/ui

## Setup

1. Clone le repo et installe les dépendances :

```bash
npm install
```

2. Crée un projet [Supabase](https://supabase.com) et exécute la migration :

```bash
# Dans le SQL Editor Supabase, exécute :
supabase/migrations/001_initial_schema.sql
```

3. Copie `.env.example` vers `.env.local` et renseigne tes clés :

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Lance l'app :

```bash
npm run dev
```

## Supabase CLI linkage

Projet Supabase partagé TeachingApps (`dqsspskdsfdiaaymrngi`) :

```bash
supabase login
supabase init
supabase link --project-ref dqsspskdsfdiaaymrngi
```

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run preview` | Prévisualiser le build |

## Fonctionnalités

- Diagnostics maths, informatique ou mixtes (express, standard, complet)
- Liens partagés pour élèves et parents (sans compte)
- Mini-tâches, raisonnement et explications orales
- Rapports professeur, parent et élève
- Export PDF

## Licence

Projet open source — NA Studio portfolio.
