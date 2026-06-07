import { api } from "./client";
import type {
  ApiDeliveryOption,
  ApiCreateShipmentRequest,
  ApiCreateShipmentResponse,
  ApiUpdateShipmentRequest,
} from "./types";

export const shipmentApi = {
  create(orderId: number | string, data: ApiCreateShipmentRequest): Promise<ApiCreateShipmentResponse> {
    return api.post<ApiCreateShipmentResponse>(`/orders/${orderId}/shipment`, data);
  },

  update(orderId: number | string, data: ApiUpdateShipmentRequest): Promise<{ id: number; order_id: number; delivered_at?: string; updated_at: string }> {
    return api.patch(`/orders/${orderId}/shipment`, data);
  },

  getDeliveryOptions(): Promise<{ options: ApiDeliveryOption[] }> {
    return api.get<{ options: ApiDeliveryOption[] }>("/delivery-options");
  },
};
