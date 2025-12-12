// src/context/ResortContext.jsx
import React, { createContext, useContext, useState, useMemo } from "react";

/**
 * ResortContext
 * - Exports: ResortContext (named), ResortProvider (named), useResort (named), default export (ResortContext)
 *
 * Usage:
 *  - Wrap app: <ResortProvider>{children}</ResortProvider>
 *  - Consume: const { resort, setResort } = useResort();
 *  - Or: import { ResortContext } from "../context/ResortContext";
 */

const ResortContext = createContext(null);

export const ResortProvider = ({ children, initialResort = null }) => {
  const [resort, setResort] = useState(initialResort);

  // Memoize value to avoid unnecessary re-renders
  const value = useMemo(() => ({ resort, setResort }), [resort]);

  return (
    <ResortContext.Provider value={value}>
      {children}
    </ResortContext.Provider>
  );
};

// Named hook export (this is what 'import { useResort } ...' expects)
export const useResort = () => {
  const ctx = useContext(ResortContext);
  if (ctx === undefined || ctx === null) {
    // Helpful dev-warning — not thrown so pages that check null still work
    // throw new Error("useResort must be used within a ResortProvider");
    return { resort: null, setResort: () => {} };
  }
  return ctx;
};

// Also export the context object itself (some files import ResortContext)
export { ResortContext };

// Default export (optional; safe if some imports use default)
export default ResortContext;
