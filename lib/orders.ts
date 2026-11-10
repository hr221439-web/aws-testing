import { Dbconnection } from "@/lib/dbconnection";
import OrderModel from "@/lib/orderModel";
import type { Order, OrderFormData, OrderStatus } from "@/types/order";

const isValidStatus = (status?: string): status is OrderStatus =>
  status === "Pending" || status === "Processing" || status === "Shipped" || status === "Delivered";

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

const normalizeString = (value: string | undefined, fallback: string) => {
  const trimmed = (value ?? "").trim();
  return trimmed || fallback;
};

type OrderRecord = {
  id?: string;
  customerName?: string;
  product?: string;
  quantity?: number | string;
  total?: number | string;
  status?: string;
  createdAt?: string | Date;
};

const serializeOrder = (order: OrderRecord): Order => {
  const createdAt = order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString();

  return {
    id: String(order.id ?? ""),
    customerName: normalizeString(order.customerName, "Walk-in Customer"),
    product: normalizeString(order.product, "Custom Order"),
    quantity: Number.isFinite(Number(order.quantity)) && Number(order.quantity) > 0 ? Number(order.quantity) : 1,
    total: Number.isFinite(Number(order.total)) ? Number(order.total) : 0,
    status: isValidStatus(order.status) ? order.status : "Pending",
    createdAt,
  };
};

const buildOrderPayload = (payload: Partial<OrderFormData> = {}) => {
  const customerName = normalizeString(payload.customerName, "Walk-in Customer");
  const product = normalizeString(payload.product, "Custom Order");
  const quantity = Number(payload.quantity ?? 1);
  const total = Number(payload.total ?? 0);
  const status = isValidStatus(payload.status) ? payload.status : "Pending";

  return {
    id: makeId(),
    customerName,
    product,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    total: Number.isFinite(total) ? total : 0,
    status,
    createdAt: new Date(),
  };
};

export const getOrders = async (): Promise<Order[]> => {
  await Dbconnection();

  const orders = await OrderModel.find({}).sort({ createdAt: -1 }).lean();

  return orders.map((order) => serializeOrder(order as OrderRecord));
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  await Dbconnection();

  const order = await OrderModel.findOne({ id }).lean();

  if (!order) {
    return null;
  }

  return serializeOrder(order as OrderRecord);
};

export const createOrder = async (payload: Partial<OrderFormData>): Promise<Order> => {
  await Dbconnection();

  const doc = await OrderModel.create(buildOrderPayload(payload));

  return serializeOrder((doc.toObject ? doc.toObject() : doc) as OrderRecord);
};

export const updateOrder = async (id: string, payload: Partial<OrderFormData>): Promise<Order | null> => {
  await Dbconnection();

  const existingOrder = await OrderModel.findOne({ id });

  if (!existingOrder) {
    return null;
  }

  const nextOrder = {
    customerName: normalizeString(payload.customerName ?? existingOrder.customerName, existingOrder.customerName),
    product: normalizeString(payload.product ?? existingOrder.product, existingOrder.product),
    quantity: Number.isFinite(Number(payload.quantity ?? existingOrder.quantity)) && Number(payload.quantity ?? existingOrder.quantity) > 0
      ? Number(payload.quantity ?? existingOrder.quantity)
      : existingOrder.quantity,
    total: Number.isFinite(Number(payload.total ?? existingOrder.total)) ? Number(payload.total ?? existingOrder.total) : existingOrder.total,
    status: isValidStatus(payload.status) ? payload.status : existingOrder.status,
  };

  const updatedOrder = await OrderModel.findOneAndUpdate(
    { id },
    { $set: nextOrder },
    { new: true, runValidators: true },
  );

  if (!updatedOrder) {
    return null;
  }

  return serializeOrder((updatedOrder.toObject ? updatedOrder.toObject() : updatedOrder) as OrderRecord);
};

export const deleteOrder = async (id: string): Promise<boolean> => {
  await Dbconnection();

  const result = await OrderModel.deleteOne({ id });
  return result.deletedCount > 0;
};
