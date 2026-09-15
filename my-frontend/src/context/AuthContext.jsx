import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("tastybite_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (err) {
      console.error("Failed to parse saved user state:", err);
      return null;
    }
  });

  const token = user?.token || null;

  // Set up Axios interceptors for Authorization header and handling 401 token expiration
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const saved = localStorage.getItem("tastybite_user");
      let storedToken = token;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.token) storedToken = parsed.token;
        } catch (_) {}
      }
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    });

    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          const url = error.config?.url || "";
          if (!url.includes("/api/login") && !url.includes("/api/signup")) {
            logout();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [token]);

  const login = (userData, userToken) => {
    const fullUser = typeof userData === 'object' && userData !== null
      ? { ...userData, token: userToken || userData.token }
      : userData;
    setUser(fullUser);
    try {
      localStorage.setItem("tastybite_user", JSON.stringify(fullUser));
    } catch (err) {
      console.error("Failed to persist user in localStorage:", err);
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("tastybite_user");
    } catch (err) {
      console.error("Failed to remove user from localStorage:", err);
    }
  };

  const userId = user?.user_id ? Number(user.user_id) : null;

  return (
    <AuthContext.Provider value={{ user, token, userId, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
