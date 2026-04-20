import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import FeaturedProductsCarousel from "./components/FeaturedProductsCarousel";
import Shop from "./components/Shop";

function HomePage() {
  return (
    <main className="pt-20">
      <div className="banner">
        <picture>
          <source
            srcSet="/media/f1ib0cwv/animated-banner-sprin-still-_v2.png?width=576&height=324&quality=85"
            media="(max-width: 575.98px)"
          />
          <source
            srcSet="/media/f1ib0cwv/animated-banner-sprin-still-_v2.png?width=768&height=432&quality=85"
            media="(max-width: 767.98px)"
          />
          <source
            srcSet="/media/f1ib0cwv/animated-banner-sprin-still-_v2.png?width=992&height=558&quality=85"
            media="(max-width: 991.98px)"
          />
          <img
            className="image"
            id="bannerImage"
            src="/media/f1ib0cwv/animated-banner-sprin-still-_v2.png?width=1920&height=1080&quality=85"
            alt=""
            loading="eager"
          />
        </picture>
        <div
          className="video"
          id="bannerVideo"
          data-vimeo-id="1163953602"
          data-vimeo-background="true"
          data-vimeo-responsive="true"
          data-vimeo-initialized="true"
        >
          <div style={{ padding: "56.25% 0 0 0", position: "relative" }}>
            <iframe
              src="https://player.vimeo.com/video/1163953602?loop=1&background=1&app_id=122963"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              title="Home page animated banner - (Spring)"
            ></iframe>
          </div>
        </div>
      </div>

      <section className="bg-white pt-8 pb-16">
        <div className="container mx-auto px-4">
          <FeaturedProductsCarousel />
        </div>
      </section>

      <section className="bg-black pt-8 pb-5">
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

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<Shop />} />
      </Routes>
    </>
  );
}
