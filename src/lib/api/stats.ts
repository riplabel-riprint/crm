import { api } from "./client";
import type { ApiOrderStats, ApiProductionStats } from "./types";

export const statsApi = {
  orders(): Promise<ApiOrderStats> {
    return api.get<ApiOrderStats>("/stats/orders");
  },

  production(): Promise<ApiProductionStats> {
    return api.get<ApiProductionStats>("/stats/production");
  },
};
