import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// Definindo o tipo de dado para o nosso contexto
type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

// Criando o contexto com valores iniciais
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

// Provedor de Autenticação
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Assina as mudanças de estado de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false); // Garante que loading seja falso em qualquer mudança de estado
    });

    // Função para carregar a sessão inicial na primeira montagem do componente
    const loadSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Erro ao obter sessão inicial:', error);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    loadSession();

    // Limpa a inscrição quando o componente for desmontado
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // O provedor que vai envolver a sua aplicação
  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar a autenticação
export const useAuth = () => useContext(AuthContext);