import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type UserMode = "simple" | "expert";

interface UserModeContextType {
  userMode: UserMode;
  setUserMode: (mode: UserMode) => void;
}

const UserModeContext = createContext<UserModeContextType | undefined>(undefined);

const STORAGE_KEY = "maia_user_mode";

export function UserModeProvider({ children }: { children: ReactNode }) {
  const [userMode, setUserModeState] = useState<UserMode>("simple");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load mode from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "expert" || stored === "simple") {
      setUserModeState(stored);
    }
    setIsLoaded(true);
  }, []);

  const setUserMode = (mode: UserMode) => {
    setUserModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  // Prevent rendering until localStorage is loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <UserModeContext.Provider value={{ userMode, setUserMode }}>
      {children}
    </UserModeContext.Provider>
  );
}

export function useUserMode(): UserModeContextType {
  const context = useContext(UserModeContext);
  if (!context) {
    throw new Error("useUserMode must be used within UserModeProvider");
  }
  return context;
}
