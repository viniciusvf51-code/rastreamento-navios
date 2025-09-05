"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Durante SSR, renderizar sem ThemeProvider para evitar mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  // Após hydration, renderizar com ThemeProvider completo
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}