"use client";

import { yoloService } from "@/lib/yoloService";
import { useEffect } from "react";

export function ModelInitializer() {
  useEffect(() => {
    // This runs only once on the client when the app loads.
    yoloService.init();
  }, []);

  return null; // This component renders nothing.
}