import { api } from "./client";
import type {
  ApiCreateOrderRequest,
  ApiCreateOrderResponse,
  ApiOrderDetail,
  ApiOrderListResponse,
  ApiUpdateStatusRequest,
  ApiUpdateStatusResponse,
  ApiAuditLogResponse,
  OrderStatus,
} from "./types";

interface ListOrdersParams {
  status?: OrderStatus;
  customer_id?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export const ordersApi = {
  list(params: ListOrdersParams = {}): Promise<ApiOrderListResponse> {
    const qs = new URLSearchParams();
    if (params.status)      qs.set("status",      params.status);
    if (params.customer_id) qs.set("customer_id", params.customer_id);
    if (params.page)        qs.set("page",        String(params.page));
    if (params.limit)       qs.set("limit",       String(params.limit));
    if (params.sort)        qs.set("sort",        params.sort);
    const query = qs.toString();
    return api.get<ApiOrderListResponse>(`/orders${query ? `?${query}` : ""}`);
  },

  get(orderId: number | string): Promise<ApiOrderDetail> {
    return api.get<ApiOrderDetail>(`/orders/${orderId}`);
  },

  create(data: ApiCreateOrderRequest): Promise<ApiCreateOrderResponse> {
    return api.post<ApiCreateOrderResponse>("/orders", data);
  },

  updateStatus(orderId: number | string, data: ApiUpdateStatusRequest): Promise<ApiUpdateStatusResponse> {
    return api.patch<ApiUpdateStatusResponse>(`/orders/${orderId}/status`, data);
  },

  getAuditLog(orderId: number | string, limit = 50): Promise<ApiAuditLogResponse> {
    return api.get<ApiAuditLogResponse>(`/orders/${orderId}/audit-log?limit=${limit}`);
  },
};
