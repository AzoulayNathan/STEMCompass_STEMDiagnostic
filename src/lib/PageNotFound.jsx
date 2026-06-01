import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function PageNotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="font-serif text-4xl font-bold mb-2">404</h1>
      <p className="text-muted-foreground mb-6">Page introuvable.</p>
      <Link to={isAuthenticated ? '/dashboard' : '/'} className="text-primary hover:underline">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
