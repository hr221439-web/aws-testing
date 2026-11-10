"use client";

import { useEffect, useMemo, useState } from "react";

import api from "@/lib/axios";
import type { Order, OrderFormData, OrderStatus } from "@/types/order";

const emptyForm: OrderFormData = {
  customerName: "",
  product: "",
  quantity: 1,
  total: 0,
  status: "Pending",
};

export default function OrderDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState<OrderFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const summary = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const pending = orders.filter((order) => order.status === "Pending").length;

    return {
      totalRevenue,
      totalOrders: orders.length,
      pending,
    };
  }, [orders]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get<Order[]>("/orders");
      setOrders(response.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load orders right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === "quantity" || name === "total" ? Number(value || 0) : value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!form.customerName.trim() || !form.product.trim()) {
      setError("Customer and product names are required.");
      return;
    }

    setSubmitting(true);

    try {
      if (editingId) {
        await api.put<Order>(`/orders/${editingId}`, form);
      } else {
        await api.post<Order>("/orders", form);
      }

      await loadOrders();
      resetForm();
    } catch (err) {
      console.error(err);
      setError("The order could not be saved. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (order: Order) => {
    setEditingId(order.id);
    setForm({
      customerName: order.customerName,
      product: order.product,
      quantity: order.quantity,
      total: Number(order.total),
      status: order.status,
    });
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this order?");

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/orders/${id}`);
      await loadOrders();

      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      setError("The order could not be deleted. Please try again.");
    }
  };

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Order operations</p>
          <h1>OrderFlow Dashboard</h1>
        </div>
        <button type="button" className="secondary-button" onClick={() => void loadOrders()}>
          Refresh
        </button>
      </header>

      <section className="summary-grid">
        <article className="summary-card accent-card">
          <span>Total revenue</span>
          <strong>${summary.totalRevenue.toFixed(2)}</strong>
        </article>
        <article className="summary-card">
          <span>Orders</span>
          <strong>{summary.totalOrders}</strong>
        </article>
        <article className="summary-card">
          <span>Pending</span>
          <strong>{summary.pending}</strong>
        </article>
      </section>

      <div className="content-grid">
        <section className="panel form-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Create or update</p>
              <h2>{editingId ? "Edit order" : "New order"}</h2>
            </div>
            {editingId ? (
              <button type="button" className="ghost-button" onClick={resetForm}>
                Cancel
              </button>
            ) : null}
          </div>

          <form className="order-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="customerName">Customer name</label>
              <input
                id="customerName"
                name="customerName"
                type="text"
                value={form.customerName}
                onChange={handleChange}
                placeholder="Jane Doe"
              />
            </div>

            <div className="input-group">
              <label htmlFor="product">Product</label>
              <input
                id="product"
                name="product"
                type="text"
                value={form.product}
                onChange={handleChange}
                placeholder="Laptop stand"
              />
            </div>

            <div className="two-column">
              <div className="input-group">
                <label htmlFor="quantity">Quantity</label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label htmlFor="total">Total</label>
                <input
                  id="total"
                  name="total"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.total}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>

            {error ? <p className="error-text">{error}</p> : null}

            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Update order" : "Create order"}
            </button>
          </form>
        </section>

        <section className="panel orders-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Live list</p>
              <h2>Orders</h2>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="empty-state">No orders yet. Create one to get started.</div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <article className="order-card" key={order.id}>
                  <div className="order-card-header">
                    <div>
                      <p className="order-id">#{order.id.slice(-6).toUpperCase()}</p>
                      <h3>{order.customerName}</h3>
                    </div>
                    <span className={`status-badge ${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="order-meta">
                    <div>
                      <span>Product</span>
                      <strong>{order.product}</strong>
                    </div>
                    <div>
                      <span>Qty</span>
                      <strong>{order.quantity}</strong>
                    </div>
                    <div>
                      <span>Created</span>
                      <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
                    </div>
                  </div>

                  <div className="order-card-footer">
                    <strong>${Number(order.total).toFixed(2)}</strong>
                    <div className="card-actions">
                      <button
                        type="button"
                        className="secondary-button small-button"
                        onClick={() => handleEdit(order)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger-button small-button"
                        onClick={() => void handleDelete(order.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
