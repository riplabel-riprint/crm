import { api } from "./client";
import type {
  ApiProductionDetail,
  ApiProductionMethod,
  ApiUpdateProductionRequest,
  ApiCompleteProductionRequest,
  ApiCompleteProductionResponse,
} from "./types";

export const productionApi = {
  get(orderId: number | string): Promise<ApiProductionDetail> {
    return api.get<ApiProductionDetail>(`/orders/${orderId}/production`);
  },

  update(orderId: number | string, data: ApiUpdateProductionRequest): Promise<{ id: number; order_id: number; progress_percentage: number; updated_at: string }> {
    return api.patch(`/orders/${orderId}/production`, data);
  },

  complete(orderId: number | string, data: ApiCompleteProductionRequest = {}): Promise<ApiCompleteProductionResponse> {
    return api.post<ApiCompleteProductionResponse>(`/orders/${orderId}/production/complete`, data);
  },

  getMethods(): Promise<{ methods: ApiProductionMethod[] }> {
    return api.get<{ methods: ApiProductionMethod[] }>("/production-methods");
  },
};
