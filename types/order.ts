export type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered";

export interface Order {
  id: string;
  customerName: string;
  product: string;
  quantity: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderFormData {
  customerName: string;
  product: string;
  quantity: number;
  total: number;
  status: OrderStatus;
}
