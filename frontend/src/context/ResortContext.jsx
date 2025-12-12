import React, { createContext, useEffect, useState } from "react";
import axios from "axios";

export const ResortContext = createContext();

export function ResortProvider({ children }) {
  const [resorts, setResorts] = useState([]);
  const [activeResort, setActiveResort] = useState(
    localStorage.getItem("activeResort") || "all"
  );

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

  useEffect(() => {
    axios.get(`${API_BASE}/api/resorts`)
      .then(res => setResorts(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    localStorage.setItem("activeResort", activeResort);
  }, [activeResort]);

  return (
    <ResortContext.Provider value={{ resorts, activeResort, setActiveResort }}>
      {children}
    </ResortContext.Provider>
  );
}
