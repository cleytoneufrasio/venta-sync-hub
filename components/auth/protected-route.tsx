import { useAuth } from '@/contexts/auth-context';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>; // Ou seu spinner de loading
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Removida a checagem de empresa para liberar acesso direto
  return <>{children}</>;
}
