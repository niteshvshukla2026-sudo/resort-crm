import React, { createContext, useContext, useState } from "react";

const ResortContext = createContext();

export const ResortProvider = ({ children }) => {
  const [selectedResort, setSelectedResort] = useState("ALL");

  return (
    <ResortContext.Provider value={{ selectedResort, setSelectedResort }}>
      {children}
    </ResortContext.Provider>
  );
};

export const useResort = () => useContext(ResortContext);
