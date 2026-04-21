'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types/user.types';
import { getMe, login as apiLogin, logout as apiLogout, setTokens } from '@/lib/api/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const tokens = await apiLogin(email, password);
    setTokens(tokens);
    const me = await getMe();
    setUser(me);
    return me;
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  return { user, loading, login, logout };
}
