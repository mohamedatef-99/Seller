import { CodStatus, OrderStatus } from './enums';

// ---- Auth ----
export interface SignupDto {
  email: string;
  password: string;
  businessName: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  seller: SellerDto;
}

export interface SellerDto {
  id: string;
  email: string;
  businessName: string;
  phone?: string | null;
  bosta: BostaConnectionStatus;
}

// ---- Bosta connection (per-seller) ----
export type BostaEnv = 'staging' | 'production';

export interface BostaConnectionStatus {
  connected: boolean;
  env: BostaEnv;
  connectedAt?: string | null;
}

export interface ConnectBostaDto {
  apiKey: string;
  env: BostaEnv;
}

// ---- Status sync ----
export interface SyncResult {
  synced: number; // orders checked
  updated: number; // orders whose status changed
}

// ---- Products ----
export interface ProductDto {
  id: string;
  name: string;
  price: number;
  sku?: string | null;
  isActive: boolean;
}

export interface CreateProductDto {
  name: string;
  price: number;
  sku?: string;
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
  sku?: string;
  isActive?: boolean;
}

// ---- Orders ----
export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderDto {
  customerName: string;
  customerPhone: string;
  addressLine: string;
  governorate: string;
  items: OrderItemInput[];
  shippingFee?: number;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderDto {
  id: string;
  customerName: string;
  customerPhone: string;
  addressLine: string;
  governorate: string;
  status: OrderStatus;
  codAmount: number;
  shippingFee: number;
  trackingNumber?: string | null;
  courierName?: string | null;
  createdAt: string;
  items: OrderItemDto[];
  cod: {
    status: CodStatus;
    expectedAmount: number;
    collectedAmount: number;
    settledAmount: number;
  };
}

// ---- Dashboard / money view ----
export interface DashboardSummary {
  ordersOut: number; // count: orders out for delivery (PENDING + IN_TRANSIT)
  delivered: number; // count: DELIVERED orders
  codCollected: number; // EGP: cash collected from customers (COLLECTED + SETTLED)
  codStillOwed: number; // EGP: collected by courier, NOT yet settled — owed to you right now (HEADLINE)
  codSettled: number; // EGP: already paid out to the seller
  codInTransit: number; // EGP: expected cash on orders still out (not collected yet)
}

export interface DashboardResponse {
  summary: DashboardSummary;
  orders: OrderDto[];
}
