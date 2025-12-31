import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

const ResortContext = createContext(null);

export const ResortProvider = ({ children }) => {
  const { user } = useAuth();

  // 🔥 DEFAULT = "ALL" (ADMIN / SUPER USER ke liye)
  const [selectedResort, setSelectedResort] = useState("ALL");

  /* =====================================================
   🔥 CHANGE 1: USER KE ASSIGNED RESORT KE HISAB SE AUTO SET
  ===================================================== */
  useEffect(() => {
    if (!user) return;

    // Agar user ke paas resorts hi nahi → ALL
    if (!Array.isArray(user.resorts) || user.resorts.length === 0) {
      setSelectedResort("ALL");
      return;
    }

    // Agar sirf ek resort assigned hai
    if (user.resorts.length === 1) {
      setSelectedResort(String(user.resorts[0]));
      return;
    }

    // Agar multiple resorts hai → defaultResort priority
    if (user.defaultResort) {
      setSelectedResort(String(user.defaultResort));
      return;
    }

    // Fallback → first resort
    setSelectedResort(String(user.resorts[0]));
  }, [user]);

  /* =====================================================
   🔥 CHANGE 2: SAFE SETTER (INVALID VALUE BLOCK)
  ===================================================== */
  const changeResort = (resortId) => {
    if (!user) return;

    // ADMIN / SUPER → ALL allowed
    if (resortId === "ALL") {
      setSelectedResort("ALL");
      return;
    }

    // Normal user → sirf assigned resorts
    if (user.resorts?.includes(resortId)) {
      setSelectedResort(resortId);
    } else {
      console.warn("Unauthorized resort switch blocked:", resortId);
    }
  };

  return (
    <ResortContext.Provider
      value={{
        selectedResort,
        setSelectedResort: changeResort, // 🔥 SAFE SETTER
        allowedResorts: user?.resorts || [],
      }}
    >
      {children}
    </ResortContext.Provider>
  );
};

export const useResort = () => useContext(ResortContext);
