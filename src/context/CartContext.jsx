import { createContext, useContext, useReducer, useEffect } from "react";
import { COMMERCE_ENABLED } from "../config/features";

/* ─────────────────────────────────────────────────────────────────────
   ACTION TYPES
   String constants used as identifiers when dispatching cart actions.
   Add new action types here if you ever extend cart behaviour.
───────────────────────────────────────────────────────────────────── */
const ADD_TO_CART     = "ADD_TO_CART";
const REMOVE_FROM_CART = "REMOVE_FROM_CART";
const UPDATE_QUANTITY  = "UPDATE_QUANTITY";
const CLEAR_CART       = "CLEAR_CART";

/* ─────────────────────────────────────────────────────────────────────
   REDUCER
   Pure function — takes the current cart array (state) and an action,
   returns the next cart array. Never mutates state directly.
───────────────────────────────────────────────────────────────────── */
function cartReducer(state, action) {
  switch (action.type) {

    case ADD_TO_CART: {
      // If the item is already in the cart, increment its quantity instead
      // of adding a duplicate entry.
      const existing = state.find((item) => item.id === action.payload.id);
      if (existing) {
        return state.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // New item — append with quantity 1
      return [...state, { ...action.payload, quantity: 1 }];
    }

    case REMOVE_FROM_CART:
      // Filter out the item whose id matches the payload
      return state.filter((item) => item.id !== action.payload.id);

    case UPDATE_QUANTITY:
      // Update quantity for a specific item, then remove it if qty drops to 0
      return state
        .map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
        .filter((item) => item.quantity > 0);

    case CLEAR_CART:
      // Wipe everything — useful for post-checkout
      return [];

    default:
      return state;
  }
}

/* ─────────────────────────────────────────────────────────────────────
   LOCAL STORAGE HELPER
   Reads the saved cart from localStorage on first load so the cart
   survives a page refresh. Falls back to an empty array on any error.

   Storage is only used while the shop is on. Saving the basket counts as
   "strictly necessary" under the cookie rules (PECR / ePrivacy) only when
   there is a basket to save — in portfolio mode nothing is written to the
   visitor's device, so no consent banner is needed.
───────────────────────────────────────────────────────────────────── */
function loadCartFromStorage() {
  if (!COMMERCE_ENABLED) return [];
  try {
    const saved = localStorage.getItem("cartItems");
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* ─────────────────────────────────────────────────────────────────────
   CONTEXT + PROVIDER
   Wrap the app in <CartProvider> to make cart state available to every
   component. Use the useCart() hook below to access it anywhere.
───────────────────────────────────────────────────────────────────── */
const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Initialise from localStorage so the cart persists across refreshes
  const [cartItems, dispatch] = useReducer(cartReducer, [], loadCartFromStorage);

  // Sync cart to localStorage every time it changes
  useEffect(() => {
    if (!COMMERCE_ENABLED) return;
    try {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
    } catch {
      // Storage unavailable (private mode / blocked) — the cart still works for this visit
    }
  }, [cartItems]);

  /* ── Cart actions ── */
  const addToCart     = (product)           => dispatch({ type: ADD_TO_CART,      payload: product });
  const removeFromCart = (productId)        => dispatch({ type: REMOVE_FROM_CART, payload: { id: productId } });
  const updateQuantity = (productId, qty)   => dispatch({ type: UPDATE_QUANTITY,  payload: { id: productId, quantity: qty } });
  const clearCart     = ()                  => dispatch({ type: CLEAR_CART });

  /* ── Derived values ── */
  // Total number of individual units across all cart items (drives the badge)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  // Total price before tax/shipping (displayed in the cart dropdown)
  const subtotal  = cartItems.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, cartCount, subtotal, addToCart, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   useCart HOOK
   Call this inside any component to get cart state and actions.
   Example: const { cartItems, addToCart, removeFromCart } = useCart();
───────────────────────────────────────────────────────────────────── */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
