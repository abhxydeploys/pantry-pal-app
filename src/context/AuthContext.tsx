
'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  loading: boolean;
  initialLoading: boolean; 
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setInitialLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl text-muted-foreground">Initializing App...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, initialLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
