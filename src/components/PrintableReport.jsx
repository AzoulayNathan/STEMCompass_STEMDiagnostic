import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

function Section({ title, children }) {
  return (
    <div className="mb-6 print:mb-4">
      <h2 className="font-serif font-bold text-base border-b border-gray-300 pb-1 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 text-sm mb-1.5">
      <span className="font-medium text-gray-500 shrink-0 w-40">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function BulletList({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="space-y-1 text-sm">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-gray-400 shrink-0 mt-0.5">•</span>
          <span>{typeof item === "string" ? item : item.label || item.name || JSON.stringify(item)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PrintableReport({ report, reportType, diagnostic, learner }) {
  if (!report) return null;

  const name = learner?.display_name || learner?.first_name || diagnostic?.learner_name || "Élève";
  const domain = { mathematics: "Mathématiques", computer_science: "Informatique", mixed: "Maths & Info" }[diagnostic?.domain] || "Maths";
  const date = new Date(diagnostic?.created_date || Date.now()).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

  const handlePrint = () => window.print();

  const s = report.sections || {};

  return (
    <div className="bg-white">
      {/* Print controls — hidden when printing */}
      <div className="print:hidden flex justify-end mb-4">
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />Imprimer / Exporter PDF
        </Button>
      </div>

      {/* Printable content */}
      <div className="max-w-2xl mx-auto p-8 print:p-6 text-foreground font-sans text-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <span className="font-serif font-semibold text-base">STEM Compass</span>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>{name} · {domain}</p>
            <p>{date}</p>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-serif text-xl font-bold mb-6">
          {reportType === "teacher" ? "Brief pédagogique" :
           reportType === "parent" ? "Rapport parent" :
           "Résumé élève"}
          {" — "}{name}
        </h1>

        {/* TEACHER REPORT */}
        {reportType === "teacher" && (
          <>
            {s.synthesis?.lines?.length > 0 && (
              <Section title="Synthèse actionnable">
                <div className="bg-gray-50 rounded p-4 space-y-1">
                  {s.synthesis.lines.map((l, i) => <p key={i} className="text-sm">{l}</p>)}
                </div>
              </Section>
            )}
            {s.understanding?.items?.length > 0 && (
              <Section title="Ce qu'il faut comprendre">
                {s.understanding.items.map((item, i) => <Row key={i} label={item.label} value={item.value} />)}
              </Section>
            )}
            {s.how_to_start && (
              <Section title="Comment commencer">
                <Row label="Angle d'entrée" value={s.how_to_start.angle} />
                <Row label="Première activité" value={s.how_to_start.activity1} />
                <Row label="Posture" value={s.how_to_start.posture} />
                <Row label="Niveau de guidage" value={s.how_to_start.guidage_level} />
              </Section>
            )}
            {s.method && (
              <Section title="Méthode recommandée">
                <p className="text-sm mb-3">{s.method.text}</p>
                <BulletList items={s.method.activities} />
              </Section>
            )}
            {s.avoid?.items?.length > 0 && (
              <Section title="Ce qu'il faut éviter">
                <BulletList items={s.avoid.items} />
              </Section>
            )}
            {s.watchlist?.items?.length > 0 && (
              <Section title="Watchlist — erreurs à surveiller">
                {s.watchlist.items.map((item, i) => (
                  <div key={i} className="mb-2 border-l-2 border-gray-200 pl-3">
                    <p className="font-medium text-sm">{item.name} <span className="text-gray-400 font-normal">({item.type})</span></p>
                    <p className="text-xs text-gray-500">{item.why}</p>
                  </div>
                ))}
              </Section>
            )}
            {s.four_week_plan?.weeks?.length > 0 && (
              <Section title="Plan 4 semaines">
                {s.four_week_plan.weeks.map((w, i) => (
                  <div key={i} className="mb-4 bg-gray-50 rounded p-3">
                    <p className="font-semibold text-sm mb-1">Semaine {w.week} — {w.title}</p>
                    <p className="text-xs text-gray-600 mb-0.5"><strong>Objectif :</strong> {w.objective}</p>
                    <p className="text-xs text-gray-600 mb-0.5"><strong>Activités :</strong> {w.activities}</p>
                    <p className="text-xs text-gray-600 mb-0.5"><strong>À surveiller :</strong> {w.monitor}</p>
                    <p className="text-xs text-gray-600"><strong>Progrès attendu :</strong> {w.expected_progress}</p>
                  </div>
                ))}
              </Section>
            )}
            {s.skill_estimate && (
              <Section title="Compétences estimées">
                <p className="text-xs text-gray-500 mb-2 italic">{s.skill_estimate.note}</p>
                {s.skill_estimate.dimensions?.map((d, i) => (
                  <Row key={i} label={d.label} value={d.value} />
                ))}
              </Section>
            )}
          </>
        )}

        {/* PARENT REPORT */}
        {reportType === "parent" && (
          <>
            {s.intro && <Section title={s.intro.title}><p className="text-sm">{s.intro.text}</p></Section>}
            {s.strengths && <Section title={s.strengths.title}><BulletList items={s.strengths.items} /></Section>}
            {s.difficulties && <Section title={s.difficulties.title}><BulletList items={s.difficulties.items} /></Section>}
            {s.teacher_plan && (
              <Section title={s.teacher_plan.title}>
                <p className="text-sm mb-2">{s.teacher_plan.text}</p>
                {s.teacher_plan.first_lesson && <p className="text-sm text-gray-600">Première séance : {s.teacher_plan.first_lesson}</p>}
              </Section>
            )}
            {s.home_help && <Section title={s.home_help.title}><BulletList items={s.home_help.items} /></Section>}
            {s.avoid && <Section title={s.avoid.title}><BulletList items={s.avoid.items} /></Section>}
            {s.next && <Section title={s.next.title}><p className="text-sm">{s.next.text}</p></Section>}
          </>
        )}

        {/* LEARNER REPORT */}
        {reportType === "learner" && (
          <div className="space-y-6">
            {Object.entries(s).filter(([k]) => k !== "title").map(([key, val]) => {
              if (!val || typeof val !== "object") return null;
              const title = val.title || key;
              const text = val.text || "";
              const items = val.items || val.weeks || [];
              return (
                <Section key={key} title={title}>
                  {text && <p className="text-sm">{text}</p>}
                  {items.length > 0 && <BulletList items={items.map(i => typeof i === "string" ? i : i.title || i)} />}
                </Section>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
          STEM Compass · Outil de pré-accompagnement pédagogique · {date}
          <br />
          Ce document est une synthèse pédagogique, pas une certification officielle.
        </div>
      </div>
    </div>
  );
}