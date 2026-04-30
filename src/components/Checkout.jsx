import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

/* ─────────────────────────────────────────────────────────────────────
   CHECKOUT PAGE
   Two-column layout on desktop (order summary left, form right).
   Single column on mobile.

   Currently captures contact + shipping details only.
   Payment (Stripe) will be wired in as the next step.
───────────────────────────────────────────────────────────────────── */
const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  address: "",
  city: "",
  country: "",
  postcode: "",
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, subtotal } = useCart();
  const [form, setForm] = useState(EMPTY_FORM);

  /* Redirect to shop if someone lands here with an empty cart */
  if (!cartItems.length) {
    return (
      <div className="min-h-screen bg-[#F6F1EB] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-[#2F2A26] text-lg">Your cart is empty.</p>
        <Link
          to="/shop"
          className="rounded-xl bg-[#D98C7A] px-6 py-3 text-sm text-white hover:bg-[#bf7360] transition"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    /* TODO: call POST /api/checkout/create-payment-intent,
             then mount the Stripe payment form with the returned client secret */
    console.log("Proceeding to payment with:", { form, cartItems });
  };

  return (
    <div className="min-h-screen bg-[#F6F1EB] pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto">

        {/* ── Page header ───────────────────────────────────────── */}
        <div className="mb-10">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1 text-sm text-[#A89E94] hover:text-[#2F2A26] transition mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to shop
          </Link>
          <h1 className="island-moments text-5xl text-[#2F2A26]">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-start">

          {/* ── LEFT: Contact + Shipping form ─────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Contact section */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DCD0]">
              <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-[#A89E94] mb-5">
                Contact
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="First name"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                />
                <Field
                  label="Last name"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                />
                <div className="sm:col-span-2">
                  <Field
                    label="Email address"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
              </div>
            </section>

            {/* Shipping section */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DCD0]">
              <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-[#A89E94] mb-5">
                Shipping address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field
                    label="Street address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    autoComplete="street-address"
                  />
                </div>
                <Field
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  autoComplete="address-level2"
                />
                <Field
                  label="Postcode"
                  name="postcode"
                  value={form.postcode}
                  onChange={handleChange}
                  autoComplete="postal-code"
                />
                <div className="sm:col-span-2">
                  <Field
                    label="Country"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    autoComplete="country-name"
                  />
                </div>
              </div>
            </section>

            {/* Submit */}
            <button
              type="submit"
              className="w-full rounded-xl bg-[#D98C7A] py-4 text-white font-medium tracking-wide hover:bg-[#bf7360] transition"
            >
              Proceed to payment
            </button>
          </form>

          {/* ── RIGHT: Order summary ───────────────────────────────── */}
          <aside className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DCD0] lg:sticky lg:top-28">
            <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-[#A89E94] mb-5">
              Order summary
            </h2>

            <ul className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <li key={item.id} className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    {/* quantity badge */}
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#2F2A26] text-[10px] font-semibold text-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <p className="text-sm font-medium text-[#2F2A26] truncate">{item.title}</p>
                    <p className="text-xs text-[#A89E94]">{item.medium}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#2F2A26] shrink-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Divider + totals */}
            <div className="border-t border-[#E8DCD0] pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-[#6B6159]">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#6B6159]">
                <span>Shipping</span>
                <span className="italic">Calculated at payment</span>
              </div>
              <div className="flex justify-between font-semibold text-[#2F2A26] text-base pt-1">
                <span>Total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Small trust note */}
            <p className="mt-6 text-center text-xs text-[#A89E94] italic">
              Secure payment powered by Stripe
            </p>
          </aside>

        </div>
      </div>
    </div>
  );
}

/* ── Reusable labelled input ──────────────────────────────────────── */
function Field({ label, name, type = "text", value, onChange, autoComplete }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-medium text-[#6B6159]">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required
        className="rounded-lg border border-[#E8DCD0] bg-[#F6F1EB] px-4 py-2.5 text-sm text-[#2F2A26] placeholder-[#C4B8AE] transition focus:border-[#D98C7A] focus:ring-1 focus:ring-[#D98C7A]"
      />
    </div>
  );
}
