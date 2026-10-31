import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // null = initial checking state, true = authenticated, false = requires password
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Check existing session cookie on startup
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });

      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(Boolean(data.authenticated));
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.warn('Session verification error:', err);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Attempt to unlock using passphrase
  const unlock = async (passphrase) => {
    setIsVerifying(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ password: passphrase })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        return { 
          success: true, 
          message: data.message || 'Welcome to our little world.' 
        };
      } else {
        const errorMsg = data.error || "That passphrase didn't work. Give it another try.";
        setAuthError(errorMsg);
        return { 
          success: false, 
          error: errorMsg 
        };
      }
    } catch (err) {
      const errorMsg = 'Unable to connect to verification server. Please try again.';
      setAuthError(errorMsg);
      return { 
        success: false, 
        error: errorMsg 
      };
    } finally {
      setIsVerifying(false);
    }
  };

  // Lock Dostflix and invalidate session
  const lockDostflix = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
      });
    } catch (err) {
      console.warn('Logout network error:', err);
    } finally {
      setIsAuthenticated(false);
      setAuthError(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isVerifying,
        authError,
        setAuthError,
        unlock,
        lockDostflix,
        checkSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
