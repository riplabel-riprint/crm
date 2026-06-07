import { api } from "./client";
import type { ApiQualityCheckRequest, ApiQualityCheckResponse } from "./types";

export const qualityApi = {
  get(orderId: number | string): Promise<ApiQualityCheckResponse> {
    return api.get<ApiQualityCheckResponse>(`/orders/${orderId}/quality-check`);
  },

  save(orderId: number | string, data: ApiQualityCheckRequest): Promise<ApiQualityCheckResponse> {
    return api.post<ApiQualityCheckResponse>(`/orders/${orderId}/quality-check`, data);
  },
};
