"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";
import { formatPrice } from "@/lib/products";

const fields = [
  { name: "name", label: "Full name", autoComplete: "name", span: 2 },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
  { name: "address", label: "Address", autoComplete: "street-address", span: 2 },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "state", label: "State", autoComplete: "address-level1" },
  { name: "postcode", label: "Postcode", autoComplete: "postal-code" },
  { name: "country", label: "Country", autoComplete: "country-name" },
];

export default function CheckoutForm() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const [customer, setCustomer] = useState({ country: "India" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-4xl border border-charcoal/10 bg-white p-10 text-center">
        <p className="text-4xl">🫙</p>
        <p className="mt-3 font-display text-2xl">Your cart is empty</p>
        <Link href="/shop" className="btn-primary mt-6">
          Shop Raw Honey
        </Link>
      </div>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items: items.map(({ productId, sizeSku, qty }) => ({ productId, sizeSku, qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      // Keep the confirmation details for /order-success (client-side only).
      sessionStorage.setItem(
        "buzzora-last-order",
        JSON.stringify({ ...data.order, shippingAddress: customer })
      );
      clearCart();
      router.push(`/order-success?order=${data.order.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="rounded-4xl border border-charcoal/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl">Shipping details</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <label key={f.name} className={f.span === 2 ? "sm:col-span-2" : ""}>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider2 text-charcoal-mute">
                  {f.label}
                </span>
                <input
                  required
                  type={f.type || "text"}
                  autoComplete={f.autoComplete}
                  value={customer[f.name] || ""}
                  onChange={(e) => setCustomer((c) => ({ ...c, [f.name]: e.target.value }))}
                  className="input"
                />
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-4xl border border-charcoal/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl">Payment</h2>
          <p className="mt-3 text-sm leading-relaxed text-charcoal-mute">
            Online payment is being set up. For now, orders are confirmed by the Buzzora team
            after you place them — we&apos;ll reach out on the phone number or email you
            provide to arrange payment and delivery.
          </p>
        </div>
      </div>

      <aside className="lg:col-span-2">
        <div className="sticky top-24 rounded-4xl border border-charcoal/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl">Order summary</h2>
          <ul className="mt-4 space-y-3 border-b border-charcoal/10 pb-4">
            {items.map((item) => (
              <li key={`${item.productId}-${item.sizeSku}`} className="flex justify-between text-sm">
                <span>
                  {item.product.name} · {item.size.weight} × {item.qty}
                </span>
                <span className="font-semibold">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal-mute">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-mute">Shipping</span>
              <span>Confirmed with order</span>
            </div>
            <div className="flex justify-between border-t border-charcoal/10 pt-3 font-display text-xl">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}
          <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full disabled:opacity-60">
            {submitting ? "Placing order…" : "Place Order"}
          </button>
          <p className="mt-3 text-center text-xs text-charcoal-mute">
            🔒 Your details are used only to fulfil your order.
          </p>
        </div>
      </aside>
    </form>
  );
}
