/* ─────────────────────────────────────────────────────────────────────
   IMPORTS
───────────────────────────────────────────────────────────────────── */
import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { initFlowbite } from "flowbite";
import { useCart } from "../context/CartContext";

/* ─────────────────────────────────────────────────────────────────────
   FLAG SVG COMPONENTS
   Inline SVGs kept here so they match the original Flowbite design.
   These are currently unused in the nav but kept for the language
   switcher when that feature is added. To remove them, just delete
   the four const blocks below.
───────────────────────────────────────────────────────────────────── */

const UsFlag = () => (
  <svg className="h-4 w-4 me-1.5" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.00023 16.5C13.1425 16.5 16.5005 13.1421 16.5005 9C16.5005 4.85786 13.1425 1.5 9.00023 1.5C4.85797 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85797 16.5 9.00023 16.5Z" fill="white" />
    <path d="M8.67548 8.99996H16.5012C16.5012 8.32308 16.4109 7.66735 16.2428 7.04358H8.67548V8.99996Z" fill="#D80027" />
    <path d="M8.67548 5.08712H15.4004C14.9413 4.338 14.3543 3.67585 13.6699 3.13074H8.67548V5.08712Z" fill="#D80027" />
    <path d="M9.0005 16.5001C10.7655 16.5001 12.3878 15.89 13.6689 14.8698H4.33209C5.61318 15.89 7.23548 16.5001 9.0005 16.5001Z" fill="#D80027" />
    <path d="M2.60125 12.9132H15.4C15.7686 12.3118 16.0545 11.6543 16.2425 10.9567H1.75879C1.94679 11.6543 2.23265 12.3118 2.60125 12.9132Z" fill="#D80027" />
    <path d="M4.97397 2.67114H5.65741L5.0217 3.13297L5.26453 3.88024L4.62884 3.41841L3.99316 3.88024L4.20292 3.23468C3.6432 3.7009 3.15262 4.24713 2.74834 4.85575H2.96732L2.56266 5.14972C2.49962 5.25489 2.43915 5.36173 2.38121 5.47015L2.57444 6.06485L2.21393 5.80293C2.12432 5.99279 2.04235 6.18692 1.96867 6.3851L2.18156 7.04036H2.96732L2.33161 7.50219L2.57444 8.24947L1.93876 7.78764L1.55798 8.0643C1.51986 8.37066 1.5 8.6827 1.5 8.99941H8.99964C8.99964 4.85763 8.99964 4.36934 8.99964 1.5C7.51811 1.5 6.13703 1.92975 4.97397 2.67114ZM5.26453 8.24947L4.62884 7.78764L3.99316 8.24947L4.23599 7.50219L3.60028 7.04036H4.38604L4.62884 6.29309L4.87165 7.04036H5.65741L5.0217 7.50219L5.26453 8.24947ZM5.0217 5.31758L5.26453 6.06485L4.62884 5.60303L3.99316 6.06485L4.23599 5.31758L3.60028 4.85575H4.38604L4.62884 4.10848L4.87165 4.85575H5.65741L5.0217 5.31758ZM7.95461 8.24947L7.31893 7.78764L6.68325 8.24947L6.92608 7.50219L6.29037 7.04036H7.07613L7.31893 6.29309L7.56173 7.04036H8.34749L7.71178 7.50219L7.95461 8.24947ZM7.71178 5.31758L7.95461 6.06485L7.31893 5.60303L6.68325 6.06485L6.92608 5.31758L6.29037 4.85575H7.07613L7.31893 4.10848L7.56173 4.85575H8.34749L7.71178 5.31758ZM7.71178 3.13297L7.95461 3.88024L7.31893 3.41841L6.68325 3.88024L6.92608 3.13297L6.29037 2.67114H7.07613L7.31893 1.92386L7.56173 2.67114H8.34749L7.71178 3.13297Z" fill="#1A47B8" />
  </svg>
);

const DeFlag = () => (
  <svg className="h-4 w-4 me-1.5" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.00023 16.5C13.1425 16.5 16.5005 13.1421 16.5005 9C16.5005 4.85786 13.1425 1.5 9.00023 1.5C4.85797 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85797 16.5 9.00023 16.5Z" fill="white" />
    <path d="M1.96631 11.6087C3.02601 14.4647 5.77508 16.5 8.99981 16.5C12.2245 16.5 14.9736 14.4647 16.0333 11.6087L8.99981 10.9565L1.96631 11.6087Z" fill="#FFDA44" />
    <path d="M8.99981 1.5C5.77508 1.5 3.02601 3.53531 1.96631 6.39132L8.99981 7.04347L16.0333 6.39129C14.9736 3.53531 12.2245 1.5 8.99981 1.5Z" fill="black" />
    <path d="M1.96649 6.39136C1.66503 7.20385 1.5 8.08264 1.5 9.00004C1.5 9.91744 1.66503 10.7962 1.96649 11.6087H16.0335C16.335 10.7962 16.5 9.91744 16.5 9.00004C16.5 8.08264 16.335 7.20385 16.0335 6.39136H1.96649Z" fill="#D80027" />
  </svg>
);

const ItFlag = () => (
  <svg className="h-4 w-4 me-1.5" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" fill="white" />
    <path d="M16.5012 9.00018C16.5012 5.77544 14.4659 3.02637 11.6099 1.96667V16.0337C14.4659 14.974 16.5012 12.2249 16.5012 9.00018Z" fill="#D80027" />
    <path d="M1.5 8.99994C1.5 12.2247 3.53531 14.9737 6.39132 16.0334V1.96643C3.53531 3.02613 1.5 5.7752 1.5 8.99994Z" fill="#249F58" />
  </svg>
);

const CnFlag = () => (
  <svg className="h-4 w-4 me-1.5" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" fill="#D80027" />
    <path d="M5.60449 6.06458L6.25195 8.05676H8.34668L6.65332 9.29016L7.30078 11.2823L5.60449 10.0519L3.9082 11.2823L4.55859 9.29016L2.8623 8.05676H4.95703L5.60449 6.06458Z" fill="#FFDA44" />
    <path d="M10.3906 13.1162L9.89551 12.5068L9.16309 12.791L9.58789 12.1318L9.09277 11.5195L9.85156 11.7217L10.2793 11.0625L10.3203 11.8477L11.082 12.0498L10.3467 12.3311L10.3906 13.1162Z" fill="#FFDA44" />
    <path d="M11.375 11.3291L11.6094 10.5791L10.9678 10.125L11.7529 10.1133L11.9844 9.36328L12.2393 10.1074L13.0244 10.0986L12.3945 10.5674L12.6465 11.3115L12.0049 10.8574L11.375 11.3291Z" fill="#FFDA44" />
    <path d="M12.7041 7.00488L12.3584 7.71094L12.9209 8.25879L12.1445 8.14746L11.7988 8.85059L11.6641 8.07715L10.8848 7.96582L11.582 7.59961L11.4473 6.82324L12.0098 7.37109L12.7041 7.00488Z" fill="#FFDA44" />
    <path d="M10.4126 4.86621L10.354 5.64844L11.0835 5.94434L10.3188 6.13184L10.2632 6.91699L9.8501 6.24902L9.08545 6.43652L9.59229 5.83594L9.17627 5.1709L9.90576 5.4668L10.4126 4.86621Z" fill="#FFDA44" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────
   NAVBAR COMPONENT
   Fixed to the top of every page (z-40). Contains:
     • Logo + site name (left)
     • Nav links — Home, Shop, About, Contact (centre)
     • Cart icon with badge + cart dropdown (right)
     • Hamburger toggle for mobile (right)

   Cart state comes from CartContext — no local cart state here.
───────────────────────────────────────────────────────────────────── */
export default function Navbar() {
  // Controls whether the cart dropdown is visible
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Pull cart data and actions from the global CartContext
  const { cartItems, cartCount, subtotal, removeFromCart } = useCart();

  // Initialise Flowbite (needed for the hamburger collapse toggle)
  useEffect(() => {
    initFlowbite();
  }, []);

  /* ── Handlers ── */
  const handleCartToggle = () => {
    setIsCartOpen((prev) => !prev);
  };

  // Placeholder until the real checkout flow is built
  const handleCheckout = () => {
    if (!cartItems.length) return;
    window.alert("Checkout flow coming soon.");
  };

  return (
    <>
      {/* ── Fixed top nav bar ──────────────────────────────────────── */}
      <nav className="bg-black fixed w-full z-40 top-0 start-0">
      <div className="relative w-full flex flex-wrap items-center justify-between gap-y-4 px-4 py-4 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:gap-6 md:px-8 xl:px-12">

        {/* ── Logo ─────────────────────────────────────────────────
            Change the src in the <img> or the text below to rebrand.
        ───────────────────────────────────────────────────────── */}
        <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse md:justify-self-start">
          <img src="/images/MM.png" className="h-12" alt="Logo" />
          <span className="self-center text-2xl text-white whitespace-nowrap island-moments font-medium">
            Maryam Mohseni
          </span>
        </Link>

        {/* ── Nav Links ────────────────────────────────────────────
            Hidden on mobile (shown by hamburger toggle).
            Add or remove <li> items here to change the nav menu.
            NavLink automatically applies the active colour class.
        ───────────────────────────────────────────────────────── */}
        <div
          className="items-center justify-center hidden w-full md:flex md:w-auto md:justify-self-center"
          id="navbar-language"
        >
          <ul className="font-medium flex flex-col items-center gap-2 p-4 border rounded-lg md:flex-row md:gap-8 md:p-0 md:mt-0 md:border-0">
            <li>
              <NavLink to="/" end className={({ isActive }) => `block py-2 px-3 rounded md:bg-transparent md:p-0 ${isActive ? "text-[#800020]" : "text-white md:hover:text-[#800020]"}`}>Home</NavLink>
            </li>
            <li>
              <NavLink to="/shop" className={({ isActive }) => `block py-2 px-3 rounded md:bg-transparent md:border-0 md:p-0 ${isActive ? "text-[#800020]" : "text-white md:hover:text-[#800020]"}`}>Shop</NavLink>
            </li>
            <li>
              {/* TODO: wire up to an /about route when that page is built */}
              <a href="#" className="block py-2 px-3 text-white rounded md:hover:bg-transparent md:border-0 md:hover:text-[#800020] md:p-0">About</a>
            </li>
            <li>
              {/* TODO: wire up to a /contact route when that page is built */}
              <a href="#" className="block py-2 px-3 text-white rounded md:hover:bg-transparent md:border-0 md:hover:text-[#800020] md:p-0">Contact</a>
            </li>
          </ul>
        </div>

        {/* ── Right Side: Cart Icon + Hamburger ────────────────────── */}
        <div className="relative flex items-center justify-end gap-1 md:justify-self-end">

          {/* ── Cart Icon Button ───────────────────────────────────
              The burgundy badge shows cartCount (total units).
              Switches to the burgundy cart icon when dropdown is open.
              Badge hidden when cart is empty.
          ───────────────────────────────────────────────────────── */}
          <button
            type="button"
            onClick={handleCartToggle}
            className="relative inline-flex items-center justify-center p-2 w-10 h-10 rounded-lg text-gray-300 hover:text-white focus:outline-none"
            aria-label="Open cart"
            aria-expanded={isCartOpen}
            aria-controls="shopping-cart-dropdown"
          >
            <img
              src={isCartOpen ? "/images/Icons/shopping_cart_burgundy.png" : "/images/Icons/shopping_cart_icon.png"}
              alt="Shopping cart"
              className="w-6 h-6 object-contain"
            />
            {/* Badge — only visible when there are items in the cart */}
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#800020] text-[10px] font-semibold text-white">
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
            className={`absolute right-0 top-full mt-3 w-[26rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl transition-all duration-200 ${
              isCartOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
            }`}
            aria-hidden={!isCartOpen}
          >
            {/* Dropdown header */}
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-semibold text-black">My Cart</h2>
              <button
                type="button"
                onClick={handleCartToggle}
                className="text-gray-500 hover:text-black"
                aria-label="Close cart"
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
                <p className="text-sm text-gray-600">Your cart is empty.</p>
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
                        <p className="truncate font-medium text-sm text-black">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.medium}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Qty: {item.quantity}</span>
                          <span className="font-semibold text-black">${Number(item.price || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      {/* Remove item button */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="shrink-0 self-start text-gray-400 hover:text-red-500 text-xs"
                        aria-label={`Remove ${item.title} from cart`}
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
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="font-semibold text-black">${subtotal.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={!cartItems.length}
                className="w-full rounded-xl bg-black py-3 text-white transition hover:bg-[#800020] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Checkout
              </button>
            </div>
          </div>

          {/* ── Hamburger (mobile only) ───────────────────────────
              Flowbite's data-collapse-toggle handles the show/hide
              of the #navbar-language menu on small screens.
          ───────────────────────────────────────────────────────── */}
          <button
            data-collapse-toggle="navbar-language"
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-300 rounded-lg md:hidden hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-600"
            aria-controls="navbar-language"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M5 7h14M5 12h14M5 17h14" />
            </svg>
          </button>

        </div>
      </div>
      </nav>

      {/* ── Backdrop overlay ─────────────────────────────────────────
          Transparent full-screen button that closes the cart dropdown
          when the user clicks anywhere outside of it.
      ─────────────────────────────────────────────────────────────── */}
      {isCartOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-transparent"
          aria-label="Close cart dropdown"
          onClick={handleCartToggle}
        />
      )}
    </>
  );
}
