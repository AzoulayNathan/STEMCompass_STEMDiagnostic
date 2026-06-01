import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { entities, setSessionToken } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Search, Users } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";

const AGE_LABELS = { child: "Enfant", teen: "Adolescent", adult: "Adulte" };

export default function Learners() {
  const navigate = useNavigate();
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAge, setFilterAge] = useState("all");
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") setShowNew(true);
    loadLearners();
  }, []);

  const loadLearners = async () => {
    setLoading(true);
    const data = await entities.Learner.list("-created_date", 100);
    setLearners(data);
    setLoading(false);
  };

  const filtered = learners.filter(l => {
    const matchSearch = !search || (l.display_name || l.first_name || "").toLowerCase().includes(search.toLowerCase());
    const matchAge = filterAge === "all" || l.age_group === filterAge;
    return matchSearch && matchAge;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      first_name: fd.get("first_name"),
      display_name: fd.get("display_name") || fd.get("first_name"),
      age: fd.get("age") ? Number(fd.get("age")) : undefined,
      age_group: fd.get("age_group"),
      domain: fd.get("domain") || undefined,
      school_level: fd.get("school_level") || undefined,
      learning_context: fd.get("learning_context"),
      primary_goal: fd.get("primary_goal"),
      notes: fd.get("notes"),
      status: "active",
    };
    const created = await entities.Learner.create(data);
    setShowNew(false);
    navigate(`/learners/${created.id}`);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-bold">Élèves</h1>
        <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}><UserPlus className="h-4 w-4" />Ajouter un élève</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterAge} onValueChange={setFilterAge}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Tranche d'âge" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="child">Enfant</SelectItem>
            <SelectItem value="teen">Adolescent</SelectItem>
            <SelectItem value="adult">Adulte</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Aucun apprenant trouvé" description={learners.length === 0 ? "Ajoutez votre premier apprenant." : "Modifiez vos filtres."} action={learners.length === 0 && <Button size="sm" onClick={() => setShowNew(true)}>Ajouter</Button>} />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Nom</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Âge</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Domaine</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Objectif</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Statut</th>
            </tr></thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => navigate(`/learners/${l.id}`)}>
                  <td className="px-4 py-3 font-medium">{l.display_name || l.first_name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{l.age ? `${l.age} ans` : AGE_LABELS[l.age_group] || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{{ mathematics: "Maths", computer_science: "Info", mixed: "Maths & Info" }[l.domain] || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell truncate max-w-[200px]">{l.primary_goal || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.status || "active"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Learner Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-serif">Nouvel élève</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div><Label>Prénom *</Label><Input name="first_name" required /></div>
            <div><Label>Nom d'usage</Label><Input name="display_name" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Âge</Label><Input name="age" type="number" min="3" max="99" /></div>
              <div><Label>Tranche d'âge *</Label>
                <select name="age_group" required className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="child">Enfant</option>
                  <option value="teen">Adolescent</option>
                  <option value="adult">Adulte</option>
                </select>
              </div>
            </div>
            <div><Label>Domaine principal</Label>
              <select name="domain" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="mathematics">Mathématiques</option>
                <option value="computer_science">Informatique</option>
                <option value="mixed">Maths & Informatique</option>
              </select>
            </div>
            <div><Label>Contexte</Label>
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
            <div><Label>Objectif principal</Label><Input name="primary_goal" placeholder="ex. Passer le bac maths, apprendre Python…" /></div>
            <div><Label>Notes pédagogiques</Label><Textarea name="notes" rows={2} /></div>
            <Button type="submit" className="w-full">Créer l'apprenant</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}