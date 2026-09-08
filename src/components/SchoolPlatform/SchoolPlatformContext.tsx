import React, { createContext, useContext } from "react";

export const SchoolPlatformContext = createContext<any>(null);

export const useSchoolPlatform = () => {
  const context = useContext(SchoolPlatformContext);
  if (!context) {
    throw new Error("useSchoolPlatform must be used within SchoolPlatformProvider");
  }
  return context;
};
