import { NextResponse } from "next/server";

import { createOrder, getOrders } from "@/lib/orders";

export async function GET() {
  try {
    const orders = await getOrders();
    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ message: "Unable to load orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = await createOrder(body);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json({ message: "Invalid order payload" }, { status: 400 });
  }
}
