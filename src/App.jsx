/* ─────────────────────────────────────────────────────────────────────
   IMPORTS
───────────────────────────────────────────────────────────────────── */
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HeroBanner from "./components/HeroBanner";
import FeaturedProductsCarousel from "./components/FeaturedProductsCarousel";
import Shop from "./components/Shop";
import Contact from "./components/Contact";
import AboutArtist from "./components/AboutArtist";
import { CartProvider } from "./context/CartContext";
import Footer from "./components/Footer";

/* ─────────────────────────────────────────────────────────────────────
   HOME PAGE
   Rendered at the "/" route. Contains:
     • Hero banner (image + Vimeo background video)
     • Featured Products Carousel section
     • Trust-bar strip (shipping / returns / rating)
───────────────────────────────────────────────────────────────────── */
function HomePage() {
  return (
    <main className="pt-0">

      {/* ── Hero Banner ─────────────────────────────────────────────
          Ken Burns slideshow over three product images.
          Swap images, adjust zoom, or change timing in
          src/components/HeroBanner.jsx.
      ─────────────────────────────────────────────────────────── */}
      <HeroBanner />

      {/* ── About the Artist ────────────────────────────────────────
          Image left, bio text centre, botanical SVG right.
          Edit text and image in src/components/AboutArtist.jsx.
      ─────────────────────────────────────────────────────────── */}
      <AboutArtist />

      {/* ── Featured Products Carousel ───────────────────────────────
          Pulls featured:true products from products.json and shows
          them in a 3-per-page flip-card carousel.
      ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#F6F1EB] pt-8 pb-16">
        <div className="container mx-auto px-4">
          <FeaturedProductsCarousel />
        </div>
      </section>

      {/* ── Trust Bar ───────────────────────────────────────────────
          Three icon + label tiles on a black background.
          Edit the text or swap icons in /public/images/Icons/.
      ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#2F2A26] pt-8 pb-5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-1 text-white">
            <h2 className="text-2xl font-bold">Welcome To My Website</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="transparent p-6 rounded-lg text-center">
              <img src="/images/Icons/global.png" alt="Globe Icon" className="mx-auto w-12 h-12 mb-4" />
              <h3 className="text-xl font-semibold text-white">Global Shipping</h3>
            </div>

            <div className="transparent p-6 rounded-lg text-center">
              <img src="/images/Icons/security.png" alt="Security Icon" className="mx-auto w-12 h-12 mb-4" />
              <h3 className="text-xl font-semibold text-white">14 Day Return</h3>
            </div>

            <div className="transparent p-6 rounded-lg text-center">
              <img src="/images/Icons/review.png" alt="Reviews Icon" className="mx-auto w-12 h-12 mb-4" />
              <h3 className="text-xl font-semibold text-white">4.4/5 Rating</h3>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   APP (ROOT)
   CartProvider wraps everything so Navbar, Shop, and the Carousel
   all share the same cart state. Add new routes inside <Routes>.
───────────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <CartProvider>
      <Navbar />
      <Routes>
        {/* Home page */}
        <Route path="/" element={<HomePage />} />
        {/* Full shop / all artwork */}
        <Route path="/shop" element={<Shop />} />
        {/* Contact / enquiry page */}
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <Footer />
    </CartProvider>
  );
}
