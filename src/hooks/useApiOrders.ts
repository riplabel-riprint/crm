"use client";

import { useEffect, useState, useCallback } from "react";
import { ordersApi, productionApi, qualityApi } from "@/lib/api";
import type {
  ApiOrderDetail,
  ApiOrderSummary,
  ApiUpdateStatusRequest,
  ApiUpdateProductionRequest,
  ApiQualityCheckRequest,
  OrderStatus,
} from "@/lib/api/types";

// ── Orders list ────────────────────────────────────────────────────────────────

interface UseOrdersListOptions {
  status?: OrderStatus;
  customer_id?: string;
  page?: number;
  limit?: number;
}

export function useOrdersList(options: UseOrdersListOptions = {}) {
  const [orders,     setOrders]     = useState<ApiOrderSummary[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_items: 0, per_page: 20 });

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ordersApi.list(options);
      setOrders(res.data);
      setPagination(res.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd pobierania zamówień");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.status, options.customer_id, options.page, options.limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { orders, loading, error, pagination, refetch: fetch };
}

// ── Single order ───────────────────────────────────────────────────────────────

export function useOrderDetail(orderId: number | string | null) {
  const [order,   setOrder]   = useState<ApiOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ordersApi.get(orderId);
      setOrder(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd pobierania zamówienia");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { order, loading, error, refetch: fetch };
}

// ── Status update ──────────────────────────────────────────────────────────────

export function useUpdateOrderStatus(orderId: number | string) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function updateStatus(data: ApiUpdateStatusRequest): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      await ordersApi.updateStatus(orderId, data);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd aktualizacji statusu");
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { updateStatus, loading, error };
}

// ── Production progress ────────────────────────────────────────────────────────

export function useUpdateProduction(orderId: number | string) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function updateProduction(data: ApiUpdateProductionRequest): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      await productionApi.update(orderId, data);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd aktualizacji produkcji");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function completeProduction(notes?: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      await productionApi.complete(orderId, { notes });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd zakończenia produkcji");
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { updateProduction, completeProduction, loading, error };
}

// ── Quality check ──────────────────────────────────────────────────────────────

export function useQualityCheck(orderId: number | string) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function saveQualityCheck(data: ApiQualityCheckRequest): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      await qualityApi.save(orderId, data);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd zapisu kontroli jakości");
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { saveQualityCheck, loading, error };
}
