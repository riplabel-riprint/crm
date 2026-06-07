import { api } from "./client";
import type { ApiFeedbackRequest, ApiFeedbackResponse } from "./types";

export const feedbackApi = {
  create(orderId: number | string, data: ApiFeedbackRequest): Promise<ApiFeedbackResponse> {
    return api.post<ApiFeedbackResponse>(`/orders/${orderId}/feedback`, data);
  },
};
