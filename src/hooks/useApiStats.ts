"use client";

import { useEffect, useState } from "react";
import { statsApi } from "@/lib/api";
import type { ApiOrderStats, ApiProductionStats } from "@/lib/api/types";

export function useOrderStats() {
  const [stats,   setStats]   = useState<ApiOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    statsApi.orders()
      .then(setStats)
      .catch(e => setError(e instanceof Error ? e.message : "Błąd pobierania statystyk"))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}

export function useProductionStats() {
  const [stats,   setStats]   = useState<ApiProductionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    statsApi.production()
      .then(setStats)
      .catch(e => setError(e instanceof Error ? e.message : "Błąd pobierania statystyk produkcji"))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}
