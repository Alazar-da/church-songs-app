"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function AppInitializer() {
  const initialize = useAuthStore(
    (state:any) => state.initialize
  );

  useEffect(() => {
    initialize();
  }, []);

  return null;
}