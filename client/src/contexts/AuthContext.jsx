import { createContext, useContext, useEffect, useState } from "react";
import { getMe,logoutUser as logout } from "../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await getMe();
      setUser(res.user);
    } catch {
        setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
  try {
    await logout();
    setUser(null);
  } catch (error) {
    console.error("Logout failed", error);
  }
};

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading,fetchUser,logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
