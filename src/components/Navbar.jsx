/* ─────────────────────────────────────────────────────────────────────
   IMPORTS
───────────────────────────────────────────────────────────────────── */
import { useEffect, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { COMMERCE_ENABLED } from "../config/features";
import { useLanguage } from "../i18n/LanguageContext";

/* ── Text in each language ───────────────────────────────────────── */
const COPY = {
  en: {
    brand: "Maryam Mohseni",
    home: "Home", gallery: "Gallery", about: "About", contact: "Contact",
    openMenu: "Open menu", closeMenu: "Close menu",
    openCart: "Open cart", closeCart: "Close cart", myCart: "My Cart",
    emptyCart: "Your cart is empty.", qty: "Qty", subtotal: "Subtotal", checkout: "Checkout",
    remove: (title) => `Remove ${title} from cart`,
  },
  fa: {
    brand: "مریم محسنی",
    home: "خانه", gallery: "گالری", about: "درباره", contact: "تماس",
    openMenu: "باز کردن منو", closeMenu: "بستن منو",
    openCart: "باز کردن سبد خرید", closeCart: "بستن سبد خرید", myCart: "سبد خرید",
    emptyCart: "سبد خرید شما خالی است.", qty: "تعداد", subtotal: "جمع", checkout: "تسویه حساب",
    remove: (title) => `حذف ${title} از سبد`,
  },
};

/* ─────────────────────────────────────────────────────────────────────
   NAVBAR COMPONENT
   Fixed to the top of every page (z-40). Contains:
     • Logo + site name (left)
     • Nav links — Home, Gallery, About, Contact (centre)
     • Cart icon with badge + cart dropdown (right)
     • Hamburger toggle for mobile (right)

   Cart state comes from CartContext — no local cart state here.
───────────────────────────────────────────────────────────────────── */
export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { pathname } = useLocation();
  const isHome = pathname === "/";
  // Navbar is transparent only on the home page when not scrolled
  const isTransparent = isHome && !isScrolled;

  const navigate = useNavigate();
  const { lang } = useLanguage();
  const c = COPY[lang];

  // Pull cart data and actions from the global CartContext
  const { cartItems, cartCount, subtotal, removeFromCart } = useCart();

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCartOpen(false);
  }, [pathname]);

  /* ── Scroll listener ──────────────────────────────────────────────
     Switches the navbar from transparent to solid once the user
     scrolls past 200 px (roughly the navbar height).
     To change the threshold, adjust the 200 value below.
  ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const getThreshold = () => (window.innerWidth < 768 ? 50 : 300);
    const onScroll = () => setIsScrolled(window.scrollY > getThreshold());
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Handlers ── */
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
      {/* ── Fixed top nav bar ──────────────────────────────────────────
          Transparent over the hero banner; becomes solid once scrolled.
          To change the scroll threshold, adjust the value in the
          useEffect scroll listener above (default 80 px).
      ─────────────────────────────────────────────────────────────── */}
      <nav className={`fixed w-full z-40 top-0 start-0 transition-all duration-900 ${
        isTransparent
          ? "bg-transparent border-b border-transparent"
          : "bg-[#F6F1EB] border-b border-[#E8DCD0] shadow-sm"
      }`}>
      <div className="relative w-full flex flex-wrap items-center justify-between gap-y-4 px-4 py-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-6 lg:px-8 xl:px-12">

        {/* ── Logo ─────────────────────────────────────────────────
            Change the src in the <img> or the text below to rebrand.

          <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse md:justify-self-start">
          <img src="/images/MM.png" className="h-12" alt="Logo" />
        ───────────────────────────────────────────────────────── */}

          <span className={`self-center text-2xl sm:text-3xl lg:text-4xl whitespace-nowrap island-moments font-medium transition-colors duration-300 ${
            isTransparent ? "text-white" : "text-[#2F2A26]"
          }`}>
            {c.brand}
          </span>

        {/* ── Desktop Nav Links ─────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-auto lg:justify-self-center">
          <ul className="font-medium flex flex-row items-center gap-8 text-lg">
            <li>
              <NavLink to="/" end className={({ isActive }) => `transition-colors duration-300 ${
                isActive ? "text-[#D98C7A]" : isTransparent ? "text-white/90 hover:text-[#D98C7A]" : "text-[#2F2A26] hover:text-[#D98C7A]"
              }`}>{c.home}</NavLink>
            </li>
            <li>
              <NavLink to="/shop" className={({ isActive }) => `transition-colors duration-300 ${
                isActive ? "text-[#D98C7A]" : isTransparent ? "text-white/90 hover:text-[#D98C7A]" : "text-[#2F2A26] hover:text-[#D98C7A]"
              }`}>{c.gallery}</NavLink>
            </li>
            <li>
              <NavLink to="/about" className={({ isActive }) => `transition-colors duration-300 ${
                isActive ? "text-[#D98C7A]" : isTransparent ? "text-white/90 hover:text-[#D98C7A]" : "text-[#2F2A26] hover:text-[#D98C7A]"
              }`}>{c.about}</NavLink>
            </li>
            <li>
              <NavLink to="/contact" className={({ isActive }) => `transition-colors duration-300 ${
                isActive ? "text-[#D98C7A]" : isTransparent ? "text-white/90 hover:text-[#D98C7A]" : "text-[#2F2A26] hover:text-[#D98C7A]"
              }`}>{c.contact}</NavLink>
            </li>
          </ul>
        </div>

        {/* ── Right Side: Cart Icon + Hamburger ────────────────────── */}
        <div className="relative flex items-center justify-end gap-1 lg:justify-self-end">

          {/* ── Instagram link ─────────────────────────────────── */}
          <a
            href="https://www.instagram.com/maryammohseni.art/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className={`inline-flex items-center justify-center p-2 w-10 h-10 rounded-lg transition-colors ${
              isTransparent ? "text-white hover:text-[#D98C7A]" : "text-[#2F2A26] hover:text-[#D98C7A]"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.975.975 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.975.975-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.975-.975-1.246-2.242-1.308-3.608C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.975-.975 2.242-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.333.014 7.053.072 5.197.157 3.355.673 2.014 2.014.673 3.355.157 5.197.072 7.053.014 8.333 0 8.741 0 12c0 3.259.014 3.667.072 4.947.085 1.856.601 3.698 1.942 5.039 1.341 1.341 3.183 1.857 5.039 1.942C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.856-.085 3.698-.601 5.039-1.942 1.341-1.341 1.857-3.183 1.942-5.039C23.986 15.667 24 15.259 24 12c0-3.259-.014-3.667-.072-4.947-.085-1.856-.601-3.698-1.942-5.039C20.645.673 18.803.157 16.947.072 15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
            </svg>
          </a>

          {/* ── Cart Icon Button ───────────────────────────────────
              Hidden when COMMERCE_ENABLED is false (portfolio mode).
              To re-enable, set COMMERCE_ENABLED = true in
              src/config/features.js
          ───────────────────────────────────────────────────────── */}
          {COMMERCE_ENABLED && <>
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

          {/* ── Cart Dropdown ──────────────────────────────────────
              Slides in below the cart icon. Visibility toggled by
              isCartOpen. Clicking the backdrop overlay (below) also
              closes it.

              To change the dropdown width, adjust w-[26rem].
              To change how many items show before scrolling, adjust max-h-96.
          ───────────────────────────────────────────────────────── */}
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

            {/* ── Cart Items List ──────────────────────────────────
                Scrollable list of cart items.
                Each row: thumbnail | title + medium + qty + price | remove ✕
            ─────────────────────────────────────────────────── */}
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

            {/* ── Subtotal + Checkout ─────────────────────────────
                Checkout button is disabled when the cart is empty.
                Replace handleCheckout with real checkout logic later.
            ─────────────────────────────────────────────────── */}
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
          </>}

          {/* ── Hamburger / Close (mobile only) ───────────────── */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className={`inline-flex items-center p-2 w-10 h-10 justify-center rounded-lg lg:hidden focus:outline-none transition-colors ${
              isMobileMenuOpen
                ? "text-[#D98C7A]"
                : isTransparent
                ? "text-white hover:text-[#D98C7A]"
                : "text-[#2F2A26] hover:text-[#D98C7A]"
            }`}
            aria-label={isMobileMenuOpen ? c.closeMenu : c.openMenu}
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

        </div>
      </div>
      </nav>

      {/* ── Mobile menu dropdown ──────────────────────────────────────
          Rendered outside <nav> so it sits below it without affecting
          the nav's fixed height. z-39 keeps it below the navbar (z-40).
      ─────────────────────────────────────────────────────────────── */}
      <div
        className={`fixed top-[65px] inset-x-0 z-39 bg-[#F6F1EB] border-b border-[#E8DCD0] shadow-lg transition-all duration-200 lg:hidden ${
          isMobileMenuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <ul className="flex flex-col font-medium px-6 py-4 gap-1">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `block py-3 px-2 rounded-lg text-base transition-colors ${
                  isActive ? "text-[#D98C7A] font-semibold" : "text-[#2F2A26] hover:text-[#D98C7A]"
                }`
              }
            >{c.home}</NavLink>
          </li>
          <li>
            <NavLink
              to="/shop"
              className={({ isActive }) =>
                `block py-3 px-2 rounded-lg text-base transition-colors ${
                  isActive ? "text-[#D98C7A] font-semibold" : "text-[#2F2A26] hover:text-[#D98C7A]"
                }`
              }
            >{c.gallery}</NavLink>
          </li>
          <li>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `block py-3 px-2 rounded-lg text-base transition-colors ${
                  isActive ? "text-[#D98C7A] font-semibold" : "text-[#2F2A26] hover:text-[#D98C7A]"
                }`
              }
            >{c.about}</NavLink>
          </li>
          <li>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `block py-3 px-2 rounded-lg text-base transition-colors ${
                  isActive ? "text-[#D98C7A] font-semibold" : "text-[#2F2A26] hover:text-[#D98C7A]"
                }`
              }
            >{c.contact}</NavLink>
          </li>
        </ul>
      </div>

      {/* ── Backdrop overlay ─────────────────────────────────────────
          Transparent full-screen button that closes the cart dropdown
          when the user clicks anywhere outside of it.
      ─────────────────────────────────────────────────────────────── */}
      {COMMERCE_ENABLED && isCartOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-transparent"
          aria-label={c.closeCart}
          onClick={handleCartToggle}
        />
      )}
      {isMobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[38] bg-black/20"
          aria-label={c.closeMenu}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
