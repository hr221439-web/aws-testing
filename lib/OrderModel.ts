import mongoose, { type Model } from "mongoose";

import type { OrderStatus } from "@/types/order";

export interface IOrderDocument extends mongoose.Document {
  id: string;
  customerName: string;
  product: string;
  quantity: number;
  total: number;
  status: OrderStatus;
  createdAt: Date;
}

const orderStatusValues: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered"];

const orderSchema = new mongoose.Schema<IOrderDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    product: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: orderStatusValues,
      default: "Pending",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

orderSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const json = ret as unknown as Record<string, unknown> & {
      _id?: unknown;
      __v?: unknown;
    };

    delete json._id;
    delete json.__v;
    return json;
  },
});

const OrderModel = (mongoose.models.Order as Model<IOrderDocument>) ||
  mongoose.model<IOrderDocument>("Order", orderSchema);

export default OrderModel;
