import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useCart } from "../context/CartContext";
import { apiUrl } from "../services/api";

/* Stripe instance — created once outside the component so it is never
   recreated on re-renders. The publishable key is safe to expose here. */
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/* CHECKOUT PAGE
   Step 1 — contact + shipping details → POSTs to server to create a
             PaymentIntent and get back a clientSecret.
   Step 2 — Stripe PaymentElement is mounted with the clientSecret;
             user enters card details and confirms payment.
   Step 3 — Success screen; cart is cleared.
 */
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
  const { cartItems, subtotal, clearCart, removeFromCart } = useCart();
  const [form, setForm]           = useState(EMPTY_FORM);
  const [clientSecret, setClientSecret] = useState(null);
  const [step, setStep]           = useState(1); // 1 | 2 | 3
  const [loading, setLoading]     = useState(false);
  const [apiError, setApiError]   = useState(null);
  const [orderConfirmationState, setOrderConfirmationState] = useState("confirmed");

  /* Redirect to shop if someone lands here with an empty cart */
  if (!cartItems.length && step !== 3) {
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

  /* Step 3: success screen */ 
  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#F6F1EB] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D98C7A]">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-4xl font-semibold text-[#2F2A26] mb-2">Thank you!</h1>
          {orderConfirmationState === "confirmed" ? (
            <p className="text-[#6B6159]">
              Your order is confirmed. A receipt has been sent to <strong>{form.email}</strong>.
            </p>
          ) : (
            <p className="text-[#6B6159] max-w-xl">
              Your payment was received and we are finalizing your order in the background. You will receive a confirmation email at <strong>{form.email}</strong> as soon as everything is recorded.
            </p>
          )}
        </div>
        <Link
          to="/"
          className="rounded-xl bg-[#D98C7A] px-8 py-3 text-sm text-white hover:bg-[#bf7360] transition"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  /* Step 1 submit: create PaymentIntent on the server */
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    setLoading(true);

    /* Expand cart items by quantity into a flat list of { id } objects */
    const items = cartItems.flatMap((item) =>
      Array.from({ length: item.quantity }, () => ({ id: item.id }))
    );

    try {
      const res = await fetch(apiUrl("/api/checkout/create-payment-intent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          buyerEmail: form.email,
          buyerName: `${form.firstName} ${form.lastName}`.trim(),
          shippingAddress: {
            line1:    form.address,
            city:     form.city,
            country:  form.country,
            postcode: form.postcode,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setClientSecret(data.clientSecret);
      setStep(2);
    } catch {
      setApiError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  /* Stripe Elements appearance (matches site palette)  */
  const stripeAppearance = {
    theme: "stripe",
    variables: {
      colorPrimary:    "#D98C7A",
      colorBackground: "#F6F1EB",
      colorText:       "#2F2A26",
      colorDanger:     "#c0392b",
      fontFamily:      "inherit",
      borderRadius:    "8px",
    },
  };

  return (
    <div className="min-h-screen bg-[#F6F1EB] pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Page header */}
        <div className="mb-10">
          {step === 1 ? (
            <Link
              to="/shop"
              className="inline-flex items-center gap-1 text-sm text-[#A89E94] hover:text-[#2F2A26] transition mb-4"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to shop
            </Link>
          ) : (
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1 text-sm text-[#A89E94] hover:text-[#2F2A26] transition mb-4"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to details
            </button>
          )}
          <h1 className="mt-3 text-4xl font-semibold text-[#2F2A26]">Checkout</h1>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mt-4">
            {["Details", "Payment"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold
                    ${step === i + 1 ? "bg-[#D98C7A] text-white" : step > i + 1 ? "bg-[#2F2A26] text-white" : "bg-[#E8DCD0] text-[#A89E94]"}`}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </span>
                <span className={`text-sm ${step === i + 1 ? "font-semibold text-[#2F2A26]" : "text-[#A89E94]"}`}>
                  {label}
                </span>
                {i === 0 && <span className="text-[#E8DCD0] mx-1"></span>}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-start">

          {/* LEFT: step content */}
          <div>
            {step === 1 && (
              <form onSubmit={handleDetailsSubmit} className="space-y-8">

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

                {apiError && (
                  <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {apiError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#D98C7A] py-4 text-white font-medium tracking-wide hover:bg-[#bf7360] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Please wait" : "Continue to payment"}
                </button>
              </form>
            )}

            {step === 2 && clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: stripeAppearance }}
              >
                <PaymentForm
                  buyerEmail={form.email}
                  clientSecret={clientSecret}
                  onSuccess={({ orderRecorded }) => {
                    clearCart();
                    setOrderConfirmationState(orderRecorded ? "confirmed" : "pending");
                    setStep(3);
                  }}
                />
              </Elements>
            )}
          </div>

          {/* RIGHT: Order summary  */}
          <aside className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DCD0] lg:sticky lg:top-28">
            <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-[#A89E94] mb-5">
              Order summary
            </h2>

            <ul className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <li key={item.id} className="flex items-center gap-4">
                  <div className="shrink-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <p className="text-sm font-medium text-[#2F2A26] truncate">{item.title}</p>
                    <p className="text-xs text-[#A89E94]">{item.medium}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#2F2A26] shrink-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  {step === 1 && (
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.title}`}
                      className="shrink-0 ml-1 text-[#C4B8AE] hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </li>
              ))}
            </ul>

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

            <p className="mt-6 text-center text-xs text-[#A89E94] italic">
              Secure payment powered by Stripe
            </p>
          </aside>

        </div>
      </div>
    </div>
  );
}

/* Stripe payment form (must live inside <Elements>) */
function PaymentForm({ buyerEmail, clientSecret, onSuccess }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying,  setPaying]  = useState(false);
  const [payError, setPayError] = useState(null);

  const waitForOrderRecord = async (paymentIntentId) => {
    const deadline = Date.now() + 15000;

    while (Date.now() < deadline) {
      const response = await fetch(apiUrl(`/api/checkout/payment-status/${paymentIntentId}`));

      if (response.ok) {
        const payload = await response.json();
        if (payload.orderRecorded) {
          return { orderRecorded: true, orderStatus: payload.orderStatus };
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    return { orderRecorded: false };
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPayError(null);
    setPaying(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        receipt_email: buyerEmail,
        /* return_url is required by Stripe for redirect-based payment methods.
           For card payments the redirect never happens, but it must be present. */
        return_url: window.location.origin,
      },
      redirect: "if_required",
    });

    if (error) {
      setPayError(error.message);
      setPaying(false);
    } else {
      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

      if (!paymentIntent?.id) {
        onSuccess({ orderRecorded: false });
        return;
      }

      const confirmation = await waitForOrderRecord(paymentIntent.id);
      onSuccess(confirmation);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-6">
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DCD0]">
        <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-[#A89E94] mb-5">
          Payment details
        </h2>
        <PaymentElement />
      </section>

      {payError && (
        <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {payError}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || paying}
        className="w-full rounded-xl bg-[#D98C7A] py-4 text-white font-medium tracking-wide hover:bg-[#bf7360] transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {paying ? "Processing…" : "Pay now"}
      </button>
    </form>
  );
}

/* Reusable labelled input */
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
