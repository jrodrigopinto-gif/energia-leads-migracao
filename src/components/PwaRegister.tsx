"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Instalação como PWA é um extra — falha de registro não deve
        // quebrar o app.
      });
    }
  }, []);
  return null;
}
