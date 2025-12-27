"use client";

import { yoloService } from "@/lib/yoloService";
import { useEffect } from "react";

export function ModelInitializer() {
  useEffect(() => {
    yoloService.init();
  }, []);

  return null;
}