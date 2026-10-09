import { createContext, useContext, useState, useEffect } from 'react';
import { authMe, authLogout, normalizeUser } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: rehydrate user from token
  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    if (!token) { setLoading(false); return; }

    authMe()
      .then((u) => setUser(normalizeUser(u)))
      .catch(() => {
        // Token invalid/expired — clear it and stay on login page
        localStorage.removeItem('cc_token');
        localStorage.removeItem('cc_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (userData, accessToken) => {
    if (accessToken) localStorage.setItem('cc_token', accessToken);
    setUser(normalizeUser(userData));
  };

  const logout = async () => {
    await authLogout();
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
