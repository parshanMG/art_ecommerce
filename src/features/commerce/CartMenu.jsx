/* ─────────────────────────────────────────────────────────────────────
   CART MENU (shop mode only)
   The navbar's cart icon with its item-count badge, and the dropdown
   listing the basket with a Checkout button. Rendered by Navbar.jsx
   when COMMERCE_ENABLED is on.

   Props:
     isTransparent — navbar is over the home-page hero (white icon)
───────────────────────────────────────────────────────────────────── */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { useLanguage } from "../../i18n/LanguageContext";

/* ── Text in each language ───────────────────────────────────────── */
const COPY = {
  en: {
    openCart: "Open cart", closeCart: "Close cart", myCart: "My Cart",
    emptyCart: "Your cart is empty.", qty: "Qty", subtotal: "Subtotal", checkout: "Checkout",
    remove: (title) => `Remove ${title} from cart`,
  },
  fa: {
    openCart: "باز کردن سبد خرید", closeCart: "بستن سبد خرید", myCart: "سبد خرید",
    emptyCart: "سبد خرید شما خالی است.", qty: "تعداد", subtotal: "جمع", checkout: "تسویه حساب",
    remove: (title) => `حذف ${title} از سبد`,
  },
};

export default function CartMenu({ isTransparent }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const c = COPY[lang];
  const { cartItems, cartCount, subtotal, removeFromCart } = useCart();

  // Close the dropdown on navigation
  useEffect(() => {
    setIsCartOpen(false);
  }, [pathname]);

  const handleCartToggle = () => {
    setIsCartOpen((prev) => !prev);
  };

  // Close the cart dropdown and navigate to the checkout page
  const handleCheckout = () => {
    if (!cartItems.length) return;
    setIsCartOpen(false);
    navigate("/checkout");
  };

  return (
    <>
      {/* ── Cart Icon Button ─────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleCartToggle}
        className={`relative inline-flex items-center justify-center p-2 w-10 h-10 rounded-lg focus:outline-none transition-colors ${
          isCartOpen
            ? "text-[#D98C7A]"
            : isTransparent
              ? "text-white hover:text-[#D98C7A]"
              : "text-[#2F2A26] hover:text-[#D98C7A]"
        }`}
        aria-label={c.openCart}
        aria-expanded={isCartOpen}
        aria-controls="shopping-cart-dropdown"
      >
        {/* Material Design shopping-cart SVG — currentColor inherits the button text colour */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6"
          aria-hidden="true"
        >
          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.17 14l.03-.12.9-1.63A1 1 0 0 1 9 12h8a1 1 0 0 0 .93-.63l2.05-4.68A1 1 0 0 0 19.05 5H5.21L4.27 3H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7.42a.25.25 0 0 1-.25-.25z"/>
        </svg>
        {/* Badge — change bg-[#D98C7A] to any colour to retheme the counter dot */}
        {cartCount > 0 && (
          <span className="absolute -top-0.5 -end-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#D98C7A] text-[10px] font-semibold text-white">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </button>

      {/* ── Cart Dropdown ────────────────────────────────────────────
          Slides in below the cart icon. Clicking the backdrop (below)
          also closes it.

          To change the dropdown width, adjust w-[26rem].
          To change how many items show before scrolling, adjust max-h-96.
      ─────────────────────────────────────────────────────────────── */}
      <div
        id="shopping-cart-dropdown"
        className={`absolute end-0 top-full mt-3 w-[26rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#E8DCD0] bg-[#F6F1EB] p-4 shadow-2xl transition-all duration-200 ${
          isCartOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
        aria-hidden={!isCartOpen}
      >
        {/* Dropdown header */}
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-semibold text-[#2F2A26]">{c.myCart}</h2>
          <button
            type="button"
            onClick={handleCartToggle}
            className="text-gray-500 hover:text-black"
            aria-label={c.closeCart}
          >
            ✕
          </button>
        </div>

        {/* ── Cart Items List ──────────────────────────────────────
            Each row: thumbnail | title + medium + qty + price | remove ✕
        ─────────────────────────────────────────────────────────── */}
        <div className="max-h-96 overflow-y-auto py-4">
          {!cartItems.length ? (
            <p className="text-sm text-gray-600">{c.emptyCart}</p>
          ) : (
            <ul className="space-y-3">
              {cartItems.map((item) => (
                <li key={item.id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                  {/* Product thumbnail */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                  {/* Product details */}
                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <p className="truncate font-medium text-sm text-[#2F2A26]">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.medium}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{c.qty}: {item.quantity}</span>
                      <span className="font-semibold text-[#2F2A26]">${Number(item.price || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  {/* Remove item button */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="shrink-0 self-start text-gray-400 hover:text-red-500 text-xs"
                    aria-label={c.remove(item.title)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Subtotal + Checkout ─────────────────────────────────
            Checkout button is disabled when the cart is empty.
        ─────────────────────────────────────────────────────────── */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{c.subtotal}</span>
            <span className="font-semibold text-[#2F2A26]">${subtotal.toFixed(2)}</span>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={!cartItems.length}
            className="w-full rounded-xl bg-[#D98C7A] py-3 text-white transition hover:bg-[#bf7360] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {c.checkout}
          </button>
        </div>
      </div>

      {/* ── Backdrop ───────────────────────────────────────────────
          Transparent full-screen button that closes the dropdown when
          the user clicks anywhere outside it. Portalled to <body> so it
          sits under the navbar (z-40) rather than inside it.
      ─────────────────────────────────────────────────────────────── */}
      {isCartOpen && createPortal(
        <button
          type="button"
          className="fixed inset-0 z-30 bg-transparent"
          aria-label={c.closeCart}
          onClick={handleCartToggle}
        />,
        document.body
      )}
    </>
  );
}
