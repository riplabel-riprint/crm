// API response types matching the backend documentation

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_production"
  | "quality_check"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface ApiOrderItem {
  id: number;
  order_id: number;
  quantity: number;
  size: string;
  color: string;
  design_file_url?: string;
  design_notes?: string;
}

export interface ApiCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface ApiProduction {
  method: string;
  started_at: string | null;
  completed_at: string | null;
  progress_percentage: number;
  produced_by: string | null;
  notes?: string;
}

export interface ApiQualityCheck {
  status: "pending" | "passed" | "failed";
  issues_found: string | null;
  checked_at?: string;
  checked_by?: string;
  notes?: string;
}

export interface ApiShipment {
  type: string;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  carrier?: string;
  estimated_delivery_date?: string;
}

// ── Order responses ────────────────────────────────────────────────────────────

export interface ApiOrderSummary {
  id: number;
  order_number: string;
  customer_name: string;
  status: OrderStatus;
  total_items: number;
  created_at: string;
  progress_percentage: number;
}

export interface ApiOrderDetail {
  id: number;
  order_number: string;
  customer: ApiCustomer;
  status: OrderStatus;
  items: ApiOrderItem[];
  production: ApiProduction;
  quality_check: ApiQualityCheck;
  shipment: ApiShipment;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiOrderListResponse {
  data: ApiOrderSummary[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page: number;
  };
}

export interface ApiCreateOrderRequest {
  customer_id: string;
  items: {
    quantity: number;
    size: string;
    color: string;
    design_file_url?: string;
    design_notes?: string;
  }[];
  notes?: string;
}

export interface ApiCreateOrderResponse {
  id: number;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
  created_at: string;
  items: ApiOrderItem[];
}

export interface ApiUpdateStatusRequest {
  new_status: OrderStatus;
  reason?: string;
}

export interface ApiUpdateStatusResponse {
  id: number;
  order_number: string;
  status: OrderStatus;
  previous_status: OrderStatus;
  updated_at: string;
  audit_log_entry_id: number;
}

// ── Production responses ───────────────────────────────────────────────────────

export interface ApiProductionMethod {
  id: number;
  code: string;
  name: string;
  description?: string;
  lead_time_hours: number;
  max_width?: number;
  max_height?: number;
  setup_cost: number;
  active?: boolean;
}

export interface ApiProductionDetail {
  id: number;
  order_id: number;
  production_method: ApiProductionMethod;
  started_at: string | null;
  completed_at: string | null;
  progress_percentage: number;
  notes: string | null;
  produced_by: string | null;
}

export interface ApiUpdateProductionRequest {
  progress_percentage?: number;
  notes?: string;
  produced_by?: string;
}

export interface ApiCompleteProductionRequest {
  notes?: string;
}

export interface ApiCompleteProductionResponse {
  id: number;
  order_id: number;
  progress_percentage: number;
  completed_at: string;
  order_status_updated: OrderStatus;
}

// ── Quality check responses ────────────────────────────────────────────────────

export interface ApiQualityCheckRequest {
  status: "passed" | "failed";
  issues_found?: string | null;
  notes?: string;
}

export interface ApiQualityCheckResponse {
  id: number;
  order_id: number;
  status: "passed" | "failed";
  checked_at: string;
  checked_by: string;
  issues_found: string | null;
  notes?: string;
}

// ── Shipment responses ─────────────────────────────────────────────────────────

export interface ApiDeliveryOption {
  id: number;
  code: string;
  name: string;
  description?: string;
  base_cost: number;
  estimated_days: number;
}

export interface ApiCreateShipmentRequest {
  delivery_option_id: number;
  carrier: string;
  tracking_number: string;
  estimated_delivery_date?: string;
}

export interface ApiCreateShipmentResponse {
  id: number;
  order_id: number;
  delivery_option: { id: number; name: string; base_cost: number };
  carrier: string;
  tracking_number: string;
  shipped_at: string;
  estimated_delivery_date?: string;
}

export interface ApiUpdateShipmentRequest {
  status: "shipped" | "delivered";
  delivered_at?: string;
  notes?: string;
}

// ── Feedback ──────────────────────────────────────────────────────────────────

export interface ApiFeedbackRequest {
  rating: number;
  quality_rating: number;
  delivery_rating: number;
  comment?: string;
  would_recommend: boolean;
}

export interface ApiFeedbackResponse {
  id: number;
  order_id: number;
  rating: number;
  quality_rating: number;
  delivery_rating: number;
  comment?: string;
  created_at: string;
}

// ── Audit log ─────────────────────────────────────────────────────────────────

export interface ApiAuditEntry {
  id: number;
  order_id: number;
  entity_type: string;
  action: "created" | "updated" | "status_changed";
  old_status?: OrderStatus;
  new_status?: OrderStatus;
  changed_by: string;
  change_reason?: string;
  created_at: string;
}

export interface ApiAuditLogResponse {
  audit_entries: ApiAuditEntry[];
  total_entries: number;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface ApiOrderStats {
  total_orders: number;
  orders_by_status: Record<OrderStatus, number>;
  average_completion_time_hours: number;
  today: {
    new_orders: number;
    completed_orders: number;
  };
}

export interface ApiProductionStats {
  by_method: {
    method: string;
    total_orders: number;
    average_progress: number;
    passed_quality_checks: number;
    failed_quality_checks: number;
  }[];
}
