/* ─────────────────────────────────────────────────────────────────────
   PURCHASE BUTTONS (shop mode only)
   The buy / basket buttons shown next to "Enquire" on artwork cards.

     BuyButtons   — gallery card overlay (Shop.jsx): Buy Now, which adds
                    the piece and goes straight to checkout, and an
                    Add to Basket / Added ✓ toggle
     BasketToggle — back of a featured-carousel card: Add to Basket /
                    Added ✓, or a Sold label

   Rendered only when COMMERCE_ENABLED is on.
───────────────────────────────────────────────────────────────────── */
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { useLanguage } from "../../i18n/LanguageContext";

/* ── Text in each language ───────────────────────────────────────── */
const COPY = {
  en: { buyNow: "Buy Now", addToBasket: "Add to Basket +", added: "Added ✓", sold: "Sold" },
  fa: { buyNow: "خرید", addToBasket: "افزودن به سبد +", added: "افزوده شد ✓", sold: "فروخته شد" },
};

function useBasket(product) {
  const { addToCart, removeFromCart, cartItems } = useCart();
  const inCart = cartItems.some((item) => item.id === product.id);
  const toggle = () => (inCart ? removeFromCart(product.id) : addToCart(product));
  return { inCart, toggle, addToCart };
}

export function BuyButtons({ product }) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const c = COPY[lang];
  const { inCart, toggle, addToCart } = useBasket(product);

  return (
    <>
      <button
        onClick={() => { addToCart(product); navigate("/checkout"); }}
        disabled={inCart}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
          inCart
            ? "bg-[#A89E94] text-white cursor-not-allowed opacity-60"
            : "bg-[#D98C7A] text-white hover:bg-[#bf7360]"
        }`}
      >
        {c.buyNow}
      </button>
      <button
        onClick={toggle}
        className="rounded-lg px-4 py-2 text-sm font-medium transition bg-[#D98C7A] text-white hover:bg-[#bf7360]"
      >
        {inCart ? c.added : c.addToBasket}
      </button>
    </>
  );
}

export function BasketToggle({ product }) {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const { inCart, toggle } = useBasket(product);

  if (!product.available) {
    return (
      <div className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-center bg-[#E8DCD0] text-[#A89E94] cursor-default">
        {c.sold}
      </div>
    );
  }

  return (
    <button
      onClick={toggle}
      className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition bg-[#D98C7A] hover:bg-[#bf7360] text-white"
    >
      {inCart ? c.added : c.addToBasket}
    </button>
  );
}
