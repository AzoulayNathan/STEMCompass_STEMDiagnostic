import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth } from '@/api/auth';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return') || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await auth.signUp(email, password, { role: 'teacher' });
        toast.success('Compte créé. Vérifiez votre email si la confirmation est activée.');
      } else {
        await auth.signIn(email, password);
        toast.success('Connexion réussie.');
      }
      navigate(returnTo);
    } catch (err) {
      toast.error(err.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Compass className="h-6 w-6 text-primary" />
            <span className="font-serif font-semibold text-xl">STEM Compass</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? 'Créer un compte professeur' : 'Connexion professeur / tuteur'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Chargement…' : isSignUp ? 'Créer le compte' : 'Se connecter'}
          </Button>
          <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? Créer un compte'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Retour à l&apos;accueil</Link>
        </p>
      </div>
    </div>
  );
}
