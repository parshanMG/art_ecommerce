import { useEffect, useMemo, useState } from "react";
import { fetchProducts, getFeaturedProducts } from "../services/productsService";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

export default function FeaturedProductsCarousel() {
  const [products, setProducts] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const allProducts = await fetchProducts();
        const featuredProducts = getFeaturedProducts(allProducts);

        if (isMounted) {
          setProducts(featuredProducts);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Failed to load products.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const pageSize = 3;
  const pages = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < products.length; i += pageSize) {
      chunks.push(products.slice(i, i + pageSize));
    }
    return chunks;
  }, [products]);

  const goNext = () => {
    if (!pages.length) return;
    setPageIndex((prev) => (prev + 1) % pages.length);
  };

  const goPrev = () => {
    if (!pages.length) return;
    setPageIndex((prev) => (prev - 1 + pages.length) % pages.length);
  };

  if (isLoading) {
    return <div className="text-center py-10 text-gray-600">Loading featured products...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  if (!products.length) {
    return <div className="text-center py-10 text-gray-600">No featured products available right now.</div>;
  }

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">Featured Products</h2>
      </div>

      <div className="flex items-center justify-center gap-3 md:gap-6">
        <button
          type="button"
          aria-label="Previous featured products"
          onClick={goPrev}
          className="shrink-0 w-10 h-10 md:w-12 md:h-12 hover:bg-gray-200 transition rounded-full flex items-center justify-center"
        >
          <img
            src="/images/Icons/arrow_back_ios_new_60dp_BLACK_FILL0_wght400_GRAD0_opsz48.png"
            alt="Previous"
            className="w-5 h-5 md:w-6 md:h-6"
          />
        </button>

        <div className="overflow-hidden flex-1">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${pageIndex * 100}%)` }}
          >
            {pages.map((page, idx) => (
              <div key={idx} className="w-full shrink-0 flex flex-col md:flex-row gap-6 md:gap-8">
                {page.map((product) => (
                  <article key={product.id} className="bg-gray-100 p-6 rounded-lg text-center flex-1">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="mx-auto w-full h-52 md:h-56 object-cover mb-4 rounded"
                    />
                    <h3 className="text-xl font-semibold mb-2">{product.title}</h3>
                    <p className="text-gray-700 mb-4">{formatCurrency(product.price)}</p>
                    <button className="bg-black hover:bg-[#800020] text-white px-4 py-2 rounded">Buy Now</button>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label="Next featured products"
          onClick={goNext}
          className="shrink-0 w-10 h-10 md:w-12 md:h-12 hover:bg-gray-200 transition rounded-full flex items-center justify-center"
        >
          <img
            src="/images/Icons/arrow_forward_ios_60dp_BLACK_FILL0_wght400_GRAD0_opsz48.png"
            alt="Next"
            className="w-5 h-5 md:w-6 md:h-6"
          />
        </button>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {pages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setPageIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`w-2.5 h-2.5 rounded-full transition ${idx === pageIndex ? "bg-black" : "bg-gray-300"}`}
          />
        ))}
      </div>
    </div>
  );
}
